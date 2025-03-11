const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  score: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 }
});

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);
