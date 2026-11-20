
import "dotenv/config";

import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";

// MongoDB connection for Better Auth
const mongoClient = new MongoClient(process.env.MONGODB_URI);

const authDatabase = mongoClient.db("salonbook");

// Connect Better Auth to MongoDB
export const connectAuthDB = async () => {
  await mongoClient.connect();
  console.log("Better Auth MongoDB connected successfully!");
};

// Google OAuth is only enabled when both credentials are configured.
const socialProviders = {};

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET
) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

// Better Auth configuration
export const auth = betterAuth({
  database: mongodbAdapter(authDatabase, {
    client: mongoClient,
  }),

  baseURL: process.env.BETTER_AUTH_URL,

  trustedOrigins: [
    process.env.CLIENT_URL,
  ],

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