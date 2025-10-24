import mongoose from "mongoose";
import "dotenv/config";
import User from "./models/User.js"; // Our User model

// --- Your Test Credentials ---
const usersToSeed = [
  {
    email: "admin@citrus.com",
    password: "password123", // Simple for testing
    role: "admin",
  },
  {
    email: "chef@citrus.com",
    password: "password123",
    role: "chef",
  },
];
// -----------------------------

const MONGO_URI =
  process.env.MANGODB_URI || "mongodb://127.0.0.1:27017/smart-dine";

const importData = async () => {
  try {
    // 1. Connect to the database
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected for seeding...");

    // 2. Clear out any old test users
    await User.deleteMany();
    console.log("Old users cleared...");

    // 3. Create the new users
    // The `.pre('save')` hook in your User.js model will
    // automatically hash these passwords before saving.
    await User.create(usersToSeed);

    console.log("----------------------------------");
    console.log("✅ Admin and Chef users created!");
    console.log("Admin: admin@citrus.com / password123");
    console.log("Chef:  chef@citrus.com / password123");
    console.log("----------------------------------");

    process.exit();
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

importData();
