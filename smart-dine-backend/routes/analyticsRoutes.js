// routes/analytics.js
import express from "express";
import {
  getDashboardStats,
  migrateExistingOrders,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/stats", getDashboardStats);

// 🔑 ONE-TIME: Run this to create revenue records for existing orders
router.post("/migrate", migrateExistingOrders);

export default router;
