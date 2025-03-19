// server/models/Question.js
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  // Add questionId field with unique auto-generated value
  questionId: {
    type: String,
    default: function() {
      return new mongoose.Types.ObjectId().toString();
    },
    unique: true
  },
  text: {
    type: String,
    required: [true, 'Pertanyaan diperlukan'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'Opsi jawaban diperlukan'],
    validate: {
      validator: function(v) {
        return v.length >= 2 && v.length <= 6; // Updated to allow up to 6 options
      },
      message: 'Pertanyaan harus memiliki 2-6 opsi jawaban'
    }
  },
  correctOption: {
    type: Number,
    required: [true, 'Indeks opsi jawaban benar diperlukan'],
    min: 0
  },
  timeLimit: {
    type: Number,
    default: 15, // 15 detik default
    min: 5,
    max: 60
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', QuestionSchema);