import express from "express"
import multer from "multer"
import path from "path"
import Garment from "../models/Garment.js"

const router = express.Router()

/* ---------- STORAGE ---------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  }
})

const upload = multer({ storage })

/* ---------- UPLOAD ---------- */

router.post("/", upload.single("image"), async (req, res) => {

  try {

    const { name, category, gender } = req.body

    const garment = new Garment({
      name,
      category,
      gender,
      image: req.file.filename   // IMPORTANT
    })

    await garment.save()

    res.json({ message: "Uploaded", garment })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }

})

/* ---------- GET ALL ---------- */

router.get("/", async (req, res) => {

  try {

    const garments = await Garment.find()

    res.json(garments)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }

})

/* ---------- DELETE ---------- */

router.delete("/:id", async (req, res) => {

  try {

    await Garment.findByIdAndDelete(req.params.id)

    res.json({ message: "Deleted" })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }

})

export default router