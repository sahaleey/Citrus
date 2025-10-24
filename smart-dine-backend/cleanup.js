// cleanup.js
import mongoose from "mongoose";
import Order from "./models/Order.js";
import Revenue from "./models/Revenue.js";
import Food from "./models/Food.js";

const MONGO_URI =
  "mongodb+srv://citrus:citrusmenu555@cluster0.oi2nz1f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const cleanDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1️⃣ Delete all orders
    const orderRes = await Order.deleteMany({});
    console.log(`Deleted ${orderRes.deletedCount} orders`);

    // 2️⃣ Delete all revenue records
    const revenueRes = await Revenue.deleteMany({});
    console.log(`Deleted ${revenueRes.deletedCount} revenue records`);

    // 3️⃣ Reset totalSold in all foods
    const foodRes = await Food.updateMany({}, { $set: { totalSold: 0 } });
    console.log(`Reset totalSold for ${foodRes.modifiedCount} foods`);

    console.log("Database cleanup completed!");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
};

cleanDatabase();
