import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema({
  guestId: { type: String, required: true },
  tableId: { type: String },
  totalAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Revenue", revenueSchema);
