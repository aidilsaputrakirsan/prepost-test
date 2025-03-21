// app/models/Question.js
import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    default: function() {
      return new mongoose.Types.ObjectId().toString();
    },
    unique: true
  },
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'Options are required'],
    validate: {
      validator: function(v) {
        return v.length >= 2 && v.length <= 6;
      },
      message: 'Questions must have 2-6 options'
    }
  },
  correctOption: {
    type: Number,
    required: [true, 'Correct option index is required'],
    min: 0
  },
  timeLimit: {
    type: Number,
    default: 15,
    min: 5,
    max: 60
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
export default Question;