import express from "express";

import { uploadImage } from "../controllers/upload.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Any authenticated user can upload an image
// (admins for services, customers/admins for profile avatars).
router.post("/", verifyToken, uploadImage);

export default router;
