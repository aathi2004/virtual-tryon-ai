const express = require("express");
const router = express.Router();
const Garment = require("../models/Garment");

router.get("/", async (req, res) => {
  const garments = await Garment.find();
  res.json(garments);
});

router.post("/", async (req, res) => {
  try {
    const garment = new Garment(req.body);
    await garment.save();
    res.status(201).json(garment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;