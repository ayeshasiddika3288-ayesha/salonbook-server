import express from "express";

import {
  getAllCustomers,
  getCustomerById,
  blockCustomer,
  unblockCustomer,
} from "../controllers/user.controller.js";

import {
  verifyToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Admin only: manage registered customers
router.get(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  getAllCustomers
);

router.patch(
  "/:id/block",
  verifyToken,
  authorizeRoles("admin"),
  blockCustomer
);

router.patch(
  "/:id/unblock",
  verifyToken,
  authorizeRoles("admin"),
  unblockCustomer
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  getCustomerById
);

export default router;
