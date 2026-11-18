
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import {
  verifyToken,
  authorizeRoles,
} from "./middlewares/auth.middleware.js";
import serviceRoutes from "./routes/service.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Better Auth route
// Important: This must be before express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

// Parse JSON requests
app.use(express.json());

app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SalonBook API is running!",
  });
});

// Temporary protected route for JWT testing
app.get("/api/test/protected", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "JWT verification successful!",
    user: req.user,
  });
});

// Temporary admin-only route
app.get(
  "/api/test/admin",
  verifyToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted!",
    });
  }
);

export default app;
