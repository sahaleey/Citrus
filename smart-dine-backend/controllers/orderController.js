import Order from "../models/Order.js";

export const placeOrder = async (req, res) => {
  const { tableId, items } = req.body;

  try {
    const newOrder = await Order.create({ tableId, items });
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: "Failed to place order" });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("items.foodId");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to get orders" });
  }
};

// Example: Express backend
export const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Failed to delete order:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "preparing", "ready"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("items.foodId");

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // ✅ Real-time notification using socket.io
    const io = req.app.get("io"); // get the socket instance
    if (status === "ready") {
      io.to(updatedOrder.tableId).emit("orderReady", {
        message: "🍛 Your order is on the way!",
        tableId: updatedOrder.tableId,
        items: updatedOrder.items.map((i) => ({
          name: i.foodId?.name,
          quantity: i.quantity,
        })),
      });
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status" });
  }
};
