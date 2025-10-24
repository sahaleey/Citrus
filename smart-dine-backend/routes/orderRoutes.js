import express from "express";
import {
  placeOrder,
  getOrders,
  getMyOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import Order from "../models/Order.js";
import Revenue from "../models/Revenue.js"; // ✅ added
import Food from "../models/Food.js"; // ✅ added

const router = express.Router();

// --- Customer Routes ---
router.post("/", placeOrder);
router.get("/my-orders", getMyOrders);

// --- Chef/Admin Routes ---
router.get("/", getOrders);
router.patch("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

// ✅ UPDATED: Save guest's revenue before clearing orders
router.delete("/guest/:guestId", async (req, res) => {
  try {
    const { guestId } = req.params;

    // 1️⃣ Fetch guest orders before deletion
    const guestOrders = await Order.find({ guestId });
    if (!guestOrders.length)
      return res
        .status(404)
        .json({ success: false, message: "No orders found" });

    // 2️⃣ Calculate total revenue
    const totalRevenue = guestOrders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );

    // 3️⃣ Log into Revenue collection
    await Revenue.create({
      guestId,
      tableId: guestOrders[0]?.tableId || "unknown",
      totalAmount: totalRevenue,
    });

    // 4️⃣ Update totalSold for each food in each order
    for (const order of guestOrders) {
      for (const item of order.items) {
        if (item.food?._id) {
          await Food.findByIdAndUpdate(item.food._id, {
            $inc: { totalSold: item.quantity },
          });
        }
      }
    }

    // 5️⃣ Delete guest orders
    await Order.deleteMany({ guestId });

    res.json({
      success: true,
      message: "Revenue logged, totalSold updated, orders cleared.",
    });
  } catch (err) {
    console.error("Error clearing guest orders:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Keep existing clear-table route (for admin)
router.delete("/clear-table/:tableId", async (req, res) => {
  try {
    const { tableId } = req.params;
    const deleted = await Order.deleteMany({ tableId });

    if (deleted.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found for this table" });
    }

    res.json({
      success: true,
      message: `Orders for table ${tableId} cleared.`,
    });
  } catch (err) {
    console.error("Error clearing orders:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error clearing orders." });
  }
});

export default router;
