
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    bookingKey: {
      type: String,
      unique: true,
      sparse: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service ID is required"],
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
    },

    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
    },

    timeSlot: {
      type: String,
      required: [true, "Appointment time slot is required"],
      trim: true,
    },

    message: {
      type: String,
      trim: true,
      default: "",
    },

    servicePrice: {
      type: Number,
      required: [true, "Service price is required"],
      min: [0, "Service price cannot be negative"],
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);

export default Appointment;
