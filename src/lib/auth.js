
import "dotenv/config";

import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";
import { getAllowedOrigins } from "./origins.js";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is missing.");
}

const cached = globalThis.betterAuthMongo || {
  client: new MongoClient(process.env.MONGODB_URI),
  promise: null,
};

globalThis.betterAuthMongo = cached;

const mongoClient = cached.client;
const authDatabase = mongoClient.db("salonbook");

export const connectAuthDB = async () => {
  if (!cached.promise) {
    cached.promise = mongoClient.connect().catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  await cached.promise;
  console.log("Better Auth MongoDB connected successfully!");
};

const trustedOrigins = getAllowedOrigins();

const isProduction = process.env.NODE_ENV === "production";

const socialProviders = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: mongodbAdapter(authDatabase, {
    client: mongoClient,
  }),

  baseURL: process.env.BETTER_AUTH_URL,

  trustedOrigins,

  // The Vercel client and the Vercel API live on different sub-domains, so the
  // session cookie is a third-party cookie and must be SameSite=None; Secure.
  advanced: {
    useSecureCookies: isProduction,
    defaultCookieAttributes: isProduction
      ? { sameSite: "none", secure: true, httpOnly: true }
      : { sameSite: "lax", secure: false, httpOnly: true },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },

  socialProviders,

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
      isBlocked: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        defaultValue: "",
        input: true,
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const passwordPaths = [
        "/sign-up/email",
        "/change-password",
        "/reset-password",
      ];

      if (!passwordPaths.includes(ctx.path)) {
        return;
      }

      const body = ctx.body || {};
      const password = body.password ?? body.newPassword;

      if (typeof password !== "string") {
        return;
      }

      if (password.length < 6) {
        throw new APIError("BAD_REQUEST", {
          message: "Password must be at least 6 characters long.",
        });
      }

      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
        throw new APIError("BAD_REQUEST", {
          message:
            "Password must include at least one uppercase and one lowercase letter.",
        });
      }
    }),
  },

  plugins: [
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          role: user.role,
          isBlocked: user.isBlocked,
        }),
      },
    }),
  ],
});
