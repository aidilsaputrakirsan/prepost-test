// server/models/Question.js
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
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
        return v.length >= 2 && v.length <= 4;
      },
      message: 'Pertanyaan harus memiliki 2-4 opsi jawaban'
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