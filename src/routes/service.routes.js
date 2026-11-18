
import express from "express";

import {
  getActiveServices,
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/service.controller.js";

import {
  verifyToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getActiveServices);

// Admin routes
router.get(
  "/admin/all",
  verifyToken,
  authorizeRoles("admin"),
  getAllServices
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  createService
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  updateService
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  deleteService
);

// Public single service route
router.get("/:id", getServiceById);

export default router;
