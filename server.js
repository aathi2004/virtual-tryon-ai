const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("your_mongodb_uri");

app.use("/api/garments", require("./routes/garments"));
app.use("/api/analytics", require("./routes/analytics"));

app.listen(5000, () => console.log("Server running on port 5000"));
