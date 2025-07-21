import express from "express";
import {
  placeOrder,
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", placeOrder); // POST /api/orders
router.get("/", getOrders); // GET /api/orders
router.patch("/:id", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;
