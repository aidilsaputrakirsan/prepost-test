// server/models/QuizState.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuizStateSchema = new Schema({
  _id: {
    type: String,  // Allow string IDs instead of ObjectId
    default: () => new mongoose.Types.ObjectId().toString() // Generate string ID if not provided
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // Important: Tell Mongoose not to override _id

module.exports = mongoose.model('QuizState', QuizStateSchema);