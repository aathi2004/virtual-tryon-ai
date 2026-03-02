const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  userId: String,
  tryOnCount: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Session", sessionSchema);