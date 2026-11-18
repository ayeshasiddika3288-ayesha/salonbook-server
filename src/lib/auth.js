
import "dotenv/config";

import { betterAuth } from "better-auth";
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
  },

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
    },
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