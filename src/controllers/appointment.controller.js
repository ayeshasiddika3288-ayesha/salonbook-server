
import Appointment from "../models/appointment.model.js";
import Service from "../models/service.model.js";

// 1. Create Appointment (Customer)
export const createAppointment = async (req, res) => {
  try {
    const { serviceId, appointmentDate, timeSlot, message } = req.body;

    if (!serviceId || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Service, appointment date and time slot are required.",
      });
    }

    const selectedDate = new Date(appointmentDate);

    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: "You cannot book an appointment in the past.",
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      status: "active",
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Active service not found.",
      });
    }

    const normalizedTimeSlot = timeSlot
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    const bookingKey = [
      service._id.toString(),
      selectedDate.toISOString().slice(0, 10),
      normalizedTimeSlot,
    ].join("_");

    const appointment = await Appointment.create({
      serviceId: service._id,
      customerId: req.user.id,
      appointmentDate: selectedDate,
      timeSlot,
      message: message || "",
      servicePrice: service.price,
      paymentStatus: "unpaid",
      status: "pending",
      bookingKey,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      data: appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This appointment slot is already booked.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create appointment.",
      error: error.message,
    });
  }
};

// 2. Get Logged-in Customer's Appointments
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      customerId: req.user.id,
    })
      .populate("serviceId", "serviceName category description price duration image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your appointments.",
      error: error.message,
    });
  }
};

// 3. Get All Appointments (Admin)
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("serviceId", "serviceName category description price duration image")
      .populate("customerId", "name email image phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments.",
      error: error.message,
    });
  }
};

// 4. Get Appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("serviceId", "serviceName category description price duration image")
      .populate("customerId", "name email image phone");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    const ownerId = appointment.customerId?._id || appointment.customerId;
    const isOwner =
      ownerId?.toString() === req.user.id.toString();

    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this appointment.",
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    const statusCode = error.name === "CastError" ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? "Invalid appointment ID."
          : "Failed to fetch appointment.",
    });
  }
};

// 5. Update Appointment Status (Admin)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["confirmed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment status.",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    // Enforce a safe state machine:
    // pending -> confirmed, pending/confirmed -> cancelled.
    if (status === "confirmed" && appointment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending appointments can be confirmed.",
      });
    }

    if (status === "cancelled" && appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This appointment is already cancelled.",
      });
    }

    appointment.status = status;

    if (status === "cancelled") {
      appointment.bookingKey = undefined;
    }

    await appointment.save();
    await appointment.populate("serviceId", "serviceName category description price duration image");
    await appointment.populate("customerId", "name email image phone");

    return res.status(200).json({
      success: true,
      message: "Appointment status updated successfully.",
      data: appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This appointment slot is already booked.",
      });
    }

    const statusCode = error.name === "CastError" ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? "Invalid appointment ID."
          : "Failed to update appointment status.",
    });
  }
};

// 6. Cancel Own Pending Appointment (Customer)
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    const isOwner =
      appointment.customerId.toString() === req.user.id.toString();

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own appointments.",
      });
    }

    if (appointment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending appointments can be cancelled.",
      });
    }

    appointment.status = "cancelled";
    appointment.bookingKey = undefined;

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully.",
      data: appointment,
    });
  } catch (error) {
    const statusCode = error.name === "CastError" ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? "Invalid appointment ID."
          : "Failed to cancel appointment.",
    });
  }
};
