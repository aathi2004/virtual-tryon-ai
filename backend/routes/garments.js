import express from "express";
import multer from "multer";
import Garment from "../models/Garment.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("image"), async (req, res) => {
  const garment = new Garment({
    name: req.body.name,
    category: req.body.category,
    gender: req.body.gender,
    image: req.file.path,
  });

  await garment.save();
  res.json({ message: "Garment uploaded" });
});

router.get("/", async (req, res) => {
  const garments = await Garment.find();
  res.json(garments);
});

router.delete("/:id", async (req, res) => {
  await Garment.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;