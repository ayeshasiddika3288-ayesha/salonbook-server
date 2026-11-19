
import { createRemoteJWKSet, jwtVerify } from "jose";
import User from "../models/user.model.js";

const baseURL = process.env.BETTER_AUTH_URL;

const JWKS = createRemoteJWKSet(
  new URL(`${baseURL}/api/auth/jwks`)
);

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

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: baseURL,
      audience: baseURL,
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
