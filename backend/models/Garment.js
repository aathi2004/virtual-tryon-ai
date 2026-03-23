import mongoose from "mongoose";

const GarmentSchema = new mongoose.Schema({

  name: String,

  category: String,

  gender: String,

  image: String

});

export default mongoose.model("Garment", GarmentSchema);