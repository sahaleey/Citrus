import express from "express";
import {
  getFoods,
  addFood,
  deleteFood,
} from "../controllers/foodController.js";

const router = express.Router();

router.get("/", getFoods); // GET /api/foods
router.post("/", addFood); // ✅ POST /api/foods
router.delete("/:id", deleteFood);

export default router;
