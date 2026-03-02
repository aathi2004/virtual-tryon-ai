const mongoose = require("mongoose");
const Garment = require("./models/Garment");

mongoose.connect("mongodb://mongodb:27017/virtual-outfit")
  .then(async () => {
    console.log("MongoDB connected for seeding");

    const count = await Garment.countDocuments();

    if (count === 0) {
      await Garment.insertMany([
        {
          name: "Red T-Shirt",
          category: "top",
          imageUrl:  "/assets/red-shirt.png",
        },
        {
          name: "Blue Shirt",
          category: "top",
          imageUrl:  "/assets/blue-shirt.png"
        },
        {
          name: "Black Jacket",
          category: "outerwear",
          imageUrl: "/assets/black-jacket.png"
        },
        {
          name: "White Hoodie",
          category: "outerwear",
          imageUrl: "/assets/white-hoodie.png"
        },
        {
          name: "Green T-Shirt",
          category: "top",
          imageUrl: "/assets/green-shirt.png"
        }
      ]);

      console.log("Garments seeded successfully");
    } else {
      console.log("Garments already exist. Skipping seed.");
    }

    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });