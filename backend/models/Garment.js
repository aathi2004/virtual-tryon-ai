import mongoose from "mongoose";

const garmentSchema = new mongoose.Schema({
  name: String,
  category: String,
  gender: String,
  image: String,
});

export default mongoose.model("Garment", garmentSchema);