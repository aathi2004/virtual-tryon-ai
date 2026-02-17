const express = require("express");
const Session = require("../models/Session");

const router = express.Router();

router.get("/", async (req, res) => {
  const totalSessions = await Session.countDocuments();
  const totalTryOns = await Session.aggregate([
    { $group: { _id: null, sum: { $sum: "$tryOnCount" } } }
  ]);

  res.json({
    totalUsers: totalSessions,
    totalSessions,
    totalTryOns: totalTryOns[0]?.sum || 0
  });
});

module.exports = router;