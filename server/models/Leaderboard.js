// server/models/Leaderboard.js
const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
  quiz: {
    type: String, // Changed from ObjectId to String
    ref: 'QuizState',
    required: true
  },
  entries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    averageResponseTime: {
      type: Number, // rata-rata waktu respons dalam milidetik
      default: 0
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);