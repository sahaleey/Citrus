// safeSeed.js
import mongoose from "mongoose";
import "dotenv/config";
import User from "./models/User.js";

const usersToSeed = [
  {
    email: "admin@citrus.com",
    password: "password123",
    role: "admin",
  },
  {
    email: "chef@citrus.com",
    password: "password123",
    role: "chef",
  },
];

const MONGO_URI = process.env.MANGODB_URI;

const importData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB...");

    for (const userData of usersToSeed) {
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`⚠️ User already exists: ${userData.email}`);
      } else {
        await User.create(userData);
        console.log(`✅ Created new user: ${userData.email}`);
      }
    }

    console.log("----------------------------------");
    console.log("✅ Seeding complete!");
    console.log("Admin: admin@citrus.com / password123");
    console.log("Chef:  chef@citrus.com / password123");
    console.log("----------------------------------");

    process.exit(0);
  } catch (error) {
    console.error(`❌ Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

importData();
