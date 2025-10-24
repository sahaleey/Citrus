import express from "express";
import { loginUser, registerUser } from "../controllers/authController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// @route  POST /api/auth/login
// Public route for anyone to try and log in
router.post("/login", loginUser);

// @route  POST /api/auth/register
// Protected route. Only a logged-in admin can create new users.
router.post("/register", protect, admin, registerUser);

export default router;
