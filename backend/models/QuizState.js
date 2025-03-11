const mongoose = require('mongoose');
const crypto = require('crypto');

const QuizStateSchema = new mongoose.Schema({
  state: { type: String, enum: ["waiting", "started", "finished"], default: "waiting" },
  startTime: { type: Date },
  endTime: { type: Date },
  adminKey: { type: String, required: true, default: () => crypto.randomBytes(16).toString('hex') }
});

module.exports = mongoose.model('QuizState', QuizStateSchema);
