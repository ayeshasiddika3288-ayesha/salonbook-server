import express from "express";

import {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
} from "../controllers/appointment.controller.js";

import {
  verifyToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Customer routes
router.post(
  "/",
  verifyToken,
  authorizeRoles("customer"),
  createAppointment
);

router.get(
  "/my",
  verifyToken,
  authorizeRoles("customer"),
  getMyAppointments
);

router.patch(
  "/:id/cancel",
  verifyToken,
  authorizeRoles("customer"),
  cancelAppointment
);

// Admin routes
router.get(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  getAllAppointments
);

router.patch(
  "/:id/status",
  verifyToken,
  authorizeRoles("admin"),
  updateAppointmentStatus
);

// Customer or Admin
router.get(
  "/:id",
  verifyToken,
  getAppointmentById
);

export default router;