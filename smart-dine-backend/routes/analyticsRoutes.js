import express from "express";
import { getDashboardStats } from "../controllers/analyticsController.js";
// Add auth middleware here later if you want to protect this route
// import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/analytics/stats
// This single endpoint will provide all data for the dashboard
// We can add 'protect' and 'admin' middleware later
router.get("/stats", getDashboardStats);

export default router;
