const mongoose = require("mongoose");

const garmentSchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  category: String
});

module.exports = mongoose.model("Garment", garmentSchema);