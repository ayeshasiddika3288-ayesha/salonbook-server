
import express from "express";
import {
  createCheckoutSession,
  getMyTransactions,
  getAllTransactions,
} from "../controllers/payment.controller.js";

import {
  verifyToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Customer: Create Stripe Checkout Session
router.post(
  "/create-checkout-session",
  verifyToken,
  authorizeRoles("customer"),
  createCheckoutSession
);

// Customer: Get own payment history
router.get(
  "/my-transactions",
  verifyToken,
  authorizeRoles("customer"),
  getMyTransactions
);

// Admin: Get all transactions
router.get(
  "/transactions",
  verifyToken,
  authorizeRoles("admin"),
  getAllTransactions
);

export default router;
