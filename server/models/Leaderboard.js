// server/models/Leaderboard.js
const mongoose = require('mongoose');

// Define a separate schema for entries to handle the userId field properly
const LeaderboardEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Add userId field with unique auto-generated value to prevent duplicate key errors
  userId: {
    type: String,
    default: function() {
      return this.user ? this.user.toString() : new mongoose.Types.ObjectId().toString();
    }
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
});

const LeaderboardSchema = new mongoose.Schema({
  quiz: {
    type: String, // Changed from ObjectId to String
    ref: 'QuizState',
    required: true
  },
  entries: [LeaderboardEntrySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add pre-save hook to ensure userId is set for each entry
LeaderboardSchema.pre('save', function(next) {
  if (this.entries) {
    this.entries.forEach(entry => {
      if (!entry.userId && entry.user) {
        entry.userId = entry.user.toString();
      }
    });
  }
  next();
});

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);