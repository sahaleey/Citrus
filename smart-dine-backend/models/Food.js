import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantityAvailable: { type: Number, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  offer: { type: String }, // optional
  image: { type: String, required: true },
});

export default mongoose.models.Food || mongoose.model("Food", foodSchema);
