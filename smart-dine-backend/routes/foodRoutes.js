import express from "express";
import { getFoods, addFood } from "../controllers/foodController.js";

const router = express.Router();

router.get("/", getFoods); // GET /api/foods
router.post("/", addFood); // ✅ POST /api/foods

export default router;
