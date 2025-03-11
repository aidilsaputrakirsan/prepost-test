const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  answer: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
  timeTaken: { type: Number, required: true },
  score: { type: Number, default: 0 },
  questionNumber: { type: Number, required: true },
  isCorrect: { type: Boolean, default: false }
});

module.exports = mongoose.model('Answer', AnswerSchema);