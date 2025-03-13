// server/controllers/quizController.js
const QuizState = require('../models/QuizState');
const Question = require('../models/Question');
const User = require('../models/User');
const Answer = require('../models/Answer');
const Leaderboard = require('../models/Leaderboard');
const asyncHandler = require('express-async-handler');

// @desc    Create a new quiz
// @route   POST /api/quiz
// @access  Private/Admin
exports.createQuiz = asyncHandler(async (req, res) => {
  // Create a new quiz session in 'waiting' state
  const quiz = await QuizState.create({
    status: 'waiting',
    questions: req.body.questions || []
  });

  res.status(201).json({
    success: true,
    data: quiz
  });
});

// @desc    Get quiz by ID
// @route   GET /api/quiz/:id
// @access  Public
exports.getQuizById = asyncHandler(async (req, res) => {
  const quiz = await QuizState.findById(req.params.id)
    .populate('questions')
    .exec();

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tidak ditemukan');
  }

  // Don't send correct answers to clients
  const safeQuiz = {
    _id: quiz._id,
    status: quiz.status,
    currentQuestionIndex: quiz.currentQuestionIndex,
    questionCount: quiz.questions.length,
    startTime: quiz.startTime,
    endTime: quiz.endTime,
    participantCount: quiz.participants.length
  };

  res.status(200).json({
    success: true,
    data: safeQuiz
  });
});

// @desc    Add questions to quiz
// @route   POST /api/quiz/:id/questions
// @access  Private/Admin
exports.addQuestions = asyncHandler(async (req, res) => {
  const quiz = await QuizState.findById(req.params.id);

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tidak ditemukan');
  }

  // Only add questions if quiz is in 'waiting' state
  if (quiz.status !== 'waiting') {
    res.status(400);
    throw new Error('Tidak dapat menambahkan pertanyaan setelah quiz dimulai');
  }

  // Add new questions
  const questions = await Promise.all(
    req.body.questions.map(async (q) => {
      const question = await Question.create({
        text: q.text,
        options: q.options,
        correctOption: q.correctOption,
        timeLimit: q.timeLimit || 15
      });
      return question._id;
    })
  );

  // Add new question IDs to quiz
  quiz.questions.push(...questions);
  await quiz.save();

  res.status(200).json({
    success: true,
    data: quiz
  });
});

// @desc    Get all questions for a quiz (admin only)
// @route   GET /api/quiz/:id/questions
// @access  Private/Admin
exports.getQuizQuestions = asyncHandler(async (req, res) => {
  const quiz = await QuizState.findById(req.params.id)
    .populate('questions')
    .exec();

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tidak ditemukan');
  }

  res.status(200).json({
    success: true,
    data: quiz.questions
  });
});

// @desc    Get current active question for a quiz
// @route   GET /api/quiz/:id/current-question
// @access  Public
exports.getCurrentQuestion = asyncHandler(async (req, res) => {
  const quiz = await QuizState.findById(req.params.id)
    .populate('questions')
    .exec();

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tidak ditemukan');
  }

  if (quiz.status !== 'active') {
    res.status(400);
    throw new Error('Quiz belum dimulai atau sudah selesai');
  }

  const currentQuestion = quiz.questions[quiz.currentQuestionIndex];

  if (!currentQuestion) {
    res.status(404);
    throw new Error('Pertanyaan tidak ditemukan');
  }

  // Send question without the correct answer
  const safeQuestion = {
    _id: currentQuestion._id,
    text: currentQuestion.text,
    options: currentQuestion.options,
    timeLimit: currentQuestion.timeLimit,
    questionNumber: quiz.currentQuestionIndex + 1,
    totalQuestions: quiz.questions.length
  };

  res.status(200).json({
    success: true,
    data: safeQuestion
  });
});

// @desc    Get leaderboard for a quiz
// @route   GET /api/quiz/:id/leaderboard
// @access  Public
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await Leaderboard.findOne({ quiz: req.params.id })
    .populate('entries.user', 'name')
    .exec();

  if (!leaderboard) {
    res.status(404);
    throw new Error('Leaderboard belum tersedia');
  }

  res.status(200).json({
    success: true,
    data: leaderboard
  });
});