import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import foodRoutes from "./routes/foodRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/auth.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { safeSeed } from "./safeSeed.js";

import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["https://citrus-juicerie.vercel.app", "http://localhost:5173"],
  })
);
app.use(express.json());

// Routes
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.get("/run-safe-seed", async (req, res) => {
  try {
    const token = req.headers["x-safe-seed-token"];
    if (!token || token !== process.env.SAFE_SEED_TOKEN) {
      return res.status(403).send("Forbidden");
    }

    await safeSeed(); // called only when route hits
    return res.send("Seeding completed");
  } catch (err) {
    console.error("Seed error:", err);
    return res.status(500).send(err.message || "Seeding failed");
  }
});

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // ⚠️ allow all during dev — tighten this in prod
    methods: ["GET", "POST"],
  },
});

// Store connected table sockets
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("joinTable", (tableId) => {
    socket.join(tableId);
    console.log(`📲 Table ${tableId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// Export io globally
app.set("io", io);

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MANGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    server.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
