import express from "express";

import { getDashboardStats } from "../controllers/admin.controller.js";

import {
  verifyToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Admin only: dashboard overview statistics
router.get(
  "/stats",
  verifyToken,
  authorizeRoles("admin"),
  getDashboardStats
);

export default router;
