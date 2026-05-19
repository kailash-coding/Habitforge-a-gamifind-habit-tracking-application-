const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema({
  title: String,
  streak: {
    type: Number,
    default: 0,
  },
  completedDates: [String],
});

module.exports = mongoose.model("Habit", habitSchema);