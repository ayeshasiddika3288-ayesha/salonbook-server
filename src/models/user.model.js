import mongoose from "mongoose";

/**
 * Better Auth manages the "user" collection.
 * This model is only used to read/update safe profile fields
 * (name, image, role, isBlocked) from our own APIs.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    image: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    collection: "user",
    strict: false,
    timestamps: false,
  }
);

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

export default User;
