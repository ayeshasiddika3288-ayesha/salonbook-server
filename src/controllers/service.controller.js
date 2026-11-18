
import Service from "../models/service.model.js";

// Get all active services (Public)
export const getActiveServices = async (req, res) => {
  try {
    const services = await Service.find({ status: "active" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all services (Admin)
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single service by ID (Public)
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError"
        ? "Invalid service ID."
        : error.message,
    });
  }
};

// Create service (Admin)
export const createService = async (req, res) => {
  try {
    const {
      serviceName,
      category,
      description,
      price,
      duration,
      image,
      status,
    } = req.body;

    const service = await Service.create({
      serviceName,
      category,
      description,
      price,
      duration,
      image,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully.",
      data: service,
    });
  } catch (error) {
    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update service (Admin)
export const updateService = async (req, res) => {
  try {
    const allowedFields = [
      "serviceName",
      "category",
      "description",
      "price",
      "duration",
      "image",
      "status",
    ];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) =>
        allowedFields.includes(key)
      )
    );

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      data: service,
    });
  } catch (error) {
    res.status(
      ["CastError", "ValidationError"].includes(error.name) ? 400 : 500
    ).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete service (Admin)
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service deleted successfully.",
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.message,
    });
  }
};
