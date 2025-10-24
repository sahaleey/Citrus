import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  tableId: {
    type: String,
    required: [true, "Table ID is required."],
  },
  guestId: {
    type: String,
    required: [true, "Guest ID is required."],
  },
  items: [
    {
      food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Food",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  totalPrice: {
    type: Number,
    required: [true, "Total price is required."],
  },
  status: {
    type: String,
    enum: ["Pending", "Preparing", "Ready", "Served", "Cancelled"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Order", orderSchema);
