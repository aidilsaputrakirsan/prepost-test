// app/models/Leaderboard.js
import mongoose from 'mongoose';

const LeaderboardEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
    type: Number,
    default: 0
  }
});

const LeaderboardSchema = new mongoose.Schema({
  quiz: {
    type: String,
    ref: 'QuizState',
    required: true
  },
  entries: [LeaderboardEntrySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to ensure userId is set
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

const Leaderboard = mongoose.models.Leaderboard || mongoose.model('Leaderboard', LeaderboardSchema);
export default Leaderboard;