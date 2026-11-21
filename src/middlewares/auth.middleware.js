
import { createRemoteJWKSet, jwtVerify } from "jose";
import User from "../models/user.model.js";

const configuredBaseURL = (process.env.BETTER_AUTH_URL || "").replace(/\/+$/, "");

const jwksSets = new Map();

const getRequestOrigin = (req) => {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol =
    (typeof forwardedProto === "string" && forwardedProto.split(",")[0].trim()) ||
    req.protocol ||
    "https";
  const host = req.get("host");

  if (!host) return configuredBaseURL;

  return `${protocol}://${host}`;
};

// Better Auth signs the JWT with the configured BETTER_AUTH_URL as iss/aud.
// The same server always exposes the matching JWKS, so we fetch keys from the
// origin that served this request (works locally and on serverless hosts).
const getJWKS = (req) => {
  const origin = getRequestOrigin(req);

  if (!origin) {
    throw new Error("Unable to resolve the API origin for JWKS verification.");
  }

  if (!jwksSets.has(origin)) {
    jwksSets.set(
      origin,
      createRemoteJWKSet(new URL(`${origin}/api/auth/jwks`))
    );
  }

  return jwksSets.get(origin);
};

const getAllowedIssuers = (req) =>
  [configuredBaseURL, getRequestOrigin(req)].filter(Boolean);

// Verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Token is required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const { payload } = await jwtVerify(token, getJWKS(req), {
      issuer: getAllowedIssuers(req),
      audience: getAllowedIssuers(req),
    });

    if (!payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload.",
      });
    }

    // Always read role and blocked status from the database so that
    // blocking a user takes effect immediately, even with an old token.
    const user = await User.findById(payload.sub)
      .select("name email role isBlocked")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account no longer exists.",
      });
    }

    req.user = {
      id: payload.sub,
      name: user.name,
      email: user.email,
      role: user.role || "customer",
      isBlocked: Boolean(user.isBlocked),
    };

    if (req.user.isBlocked === true) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// Check user roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not have permission.",
      });
    }

    next();
  };
};
