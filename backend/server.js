const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const garmentRoutes = require("./routes/garments");
const analyticsRoutes = require("./routes/analytics");

const app = express();

/* -------------------------
   Middleware
-------------------------- */
app.use(cors());
app.use(express.json());

/* -------------------------
   MongoDB Connection
   (IMPORTANT: use service name inside Docker)
-------------------------- */
mongoose.connect("mongodb://mongodb:27017/virtual-outfit", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected");
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

/* -------------------------
   Routes
-------------------------- */
app.get("/", (req, res) => {
  res.send("🚀 Virtual Outfit Backend Running");
});

app.use("/api/garments", garmentRoutes);
app.use("/api/analytics", analyticsRoutes);

/* -------------------------
   Server Listen
   (Must use 0.0.0.0 for Docker)
-------------------------- */
const PORT = 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Server running on port ${PORT}`);
});