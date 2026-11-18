
import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Service category is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Service description is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Service price is required"],
      min: [0, "Price cannot be negative"],
    },

    duration: {
      type: Number,
      required: [true, "Service duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },

    image: {
      type: String,
      required: [true, "Service image is required"],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Service =
  mongoose.models.Service ||
  mongoose.model("Service", serviceSchema);

export default Service;
