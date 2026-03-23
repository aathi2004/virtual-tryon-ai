import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import garmentsRoute from "./routes/garments.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log("✅ Mongo Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

app.use("/api/garments", garmentsRoute);

app.listen(8000, ()=>console.log("🚀 Server running on 8000"));

