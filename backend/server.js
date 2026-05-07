import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import garmentsRoute from "./routes/garments.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static("uploads"));

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Mongo Connected"))
    .catch((err) => console.error("❌ Mongo Error:", err.message));
} else {
  console.warn("⚠️  MONGO_URI not set — running without database");
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, mongo: mongoose.connection.readyState === 1 });
});

app.use("/api/garments", garmentsRoute);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));

