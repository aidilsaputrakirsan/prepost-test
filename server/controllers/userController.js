// server/controllers/userController.js
const User = require('../models/User');
const QuizState = require('../models/QuizState');
const asyncHandler = require('express-async-handler');

// @desc    Create a new participant
// @route   POST /api/user
// @access  Public
exports.createParticipant = asyncHandler(async (req, res) => {
  const { name, quizId } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Nama diperlukan');
  }

  // Check if quiz exists and is in waiting state
  const quiz = await QuizState.findById(quizId);

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tidak ditemukan');
  }

  if (quiz.status !== 'waiting') {
    res.status(400);
    throw new Error('Quiz sudah dimulai atau selesai');
  }

  // Create user (non-admin)
  const user = await User.create({
    name,
    currentQuiz: quizId,
    isAdmin: false
  });

  // Add user to participants
  quiz.participants.push(user._id);
  await quiz.save();

  res.status(201).json({
    _id: user._id,
    name: user.name,
    currentQuiz: user.currentQuiz,
    score: user.score,
    token: user.getSignedJwtToken()
  });
});

// @desc    Get participants for a quiz
// @route   GET /api/user/quiz/:quizId
// @access  Private/Admin
exports.getQuizParticipants = asyncHandler(async (req, res) => {
  const quiz = await QuizState.findById(req.params.quizId);

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tidak ditemukan');
  }

  const participants = await User.find({ _id: { $in: quiz.participants } })
    .select('name score')
    .exec();

  res.status(200).json({
    success: true,
    count: participants.length,
    data: participants
  });
});
