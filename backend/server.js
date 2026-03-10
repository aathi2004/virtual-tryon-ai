import express from "express";
import mongoose from "mongoose";
import garmentRoutes from "./routes/garments.js";

const app = express();

app.use(express.json());
app.use("/api/garments", garmentRoutes);

app.listen(8000, () => console.log("Server running on port 8000"));