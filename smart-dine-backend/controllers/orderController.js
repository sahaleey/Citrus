import Order from "../models/Order.js";
import Food from "../models/Food.js"; // ✅ Import Food model for analytics

// Place a new order
export const placeOrder = async (req, res) => {
  const { tableId, guestId, items, totalPrice } = req.body;

  if (!tableId || !guestId || !items?.length) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order data" });
  }

  // Ensure all items have valid food ObjectId
  const sanitizedItems = items.map((item) => ({
    food: item.food || null,
    name: item.name || "Unnamed food",
    price: item.price || 0,
    quantity: item.quantity || 1,
  }));

  try {
    const newOrder = await Order.create({
      tableId,
      guestId,
      items: sanitizedItems,
      totalPrice: totalPrice || 0,
    });

    const io = req.app.get("io");
    const populatedOrder = await newOrder.populate("items.food");
    io.emit("newOrder", populatedOrder);

    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    console.error("Failed to place order:", err);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: err.message,
    });
  }
};

// Get active orders for chefs
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ["Pending", "Preparing", "Ready"] },
    })
      .sort({ createdAt: 1 })
      .populate("items.food");

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("Failed to get orders:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
      error: err.message,
    });
  }
};

// Get all orders for a specific guest
export const getMyOrders = async (req, res) => {
  const { guestId, tableId } = req.query;
  if (!guestId || !tableId)
    return res
      .status(400)
      .json({ success: false, message: "Guest ID and Table ID required." });

  try {
    const orders = await Order.find({ guestId, tableId })
      .sort({ createdAt: -1 })
      .populate("items.food");

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete an order
export const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const io = req.app.get("io");
    io.emit("orderDeleted", { id: req.params.id });

    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    console.error("Failed to delete order:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: err.message,
    });
  }
};

// Update order status (and trigger analytics)
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "Pending",
    "Preparing",
    "Ready",
    "Served",
    "Cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid status value" });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("items.food");

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const io = req.app.get("io");
    io.emit("orderUpdated", updatedOrder);

    // Notify customer if ready/served
    if (status === "Ready" || status === "Served") {
      io.to(updatedOrder.tableId).emit("orderStatusUpdate", updatedOrder);
    }

    // ✅ When order is Served, record analytics for top-selling foods
    if (status === "Served") {
      for (const item of updatedOrder.items) {
        if (item.food?._id) {
          await Food.findByIdAndUpdate(item.food._id, {
            $inc: { totalSold: item.quantity },
          });
        }
      }
    }

    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    console.error("Failed to update order status:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: err.message,
    });
  }
};
