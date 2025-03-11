 // controllers/authController.js
const User = require('../models/User');

// Login user / Create new user
exports.login = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ name });
    
    if (user) {
      // Update existing user
      user.avatar = avatar || user.avatar;
      user.status = "waiting";
      await user.save();
    } else {
      // Create new user
      user = new User({
        name,
        avatar,
        status: "waiting"
      });
      await user.save();
    }
    
    return res.status(200).json({
      status: "success",
      user: {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// controllers/quizController.js
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');
const QuizState = require('../models/QuizState');
const io = require('../server').io;

// Get all questions
exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find().select('-__v');
    
    return res.status(200).json({
      status: "success",
      questions: questions.map(q => ({
        id: q.questionId,
        soal: q.question,
        opsiA: q.optionA,
        opsiB: q.optionB,
        opsiC: q.optionC,
        opsiD: q.optionD,
        jawaban: q.correctAnswer
      }))
    });
  } catch (error) {
    console.error('Get questions error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// Calculate bonus based on time taken
const calculateBonus = (timeTaken) => {
  if (timeTaken <= 1) return 5;
  if (timeTaken <= 2) return 4;
  if (timeTaken <= 5) return 3;
  if (timeTaken <= 10) return 1;
  return 0;
};

// Submit answer
exports.submitAnswer = async (req, res) => {
  try {
    const { userId, questionId, answer, timeTaken, questionNumber, totalQuestions } = req.body;
    
    // Find the question to get correct answer
    const question = await Question.findOne({ questionId });
    
    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "Question not found"
      });
    }
    
    // Normalize answers for comparison
    const normalizedUserAnswer = (answer || "").toString().trim().toUpperCase();
    const normalizedCorrectAnswer = question.correctAnswer.toString().trim().toUpperCase();
    
    // Calculate score
    let baseScore = 0;
    let bonusScore = 0;
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer && normalizedUserAnswer !== "";
    
    if (isCorrect) {
      baseScore = 10; // Base score for correct answer
      bonusScore = calculateBonus(timeTaken);
    }
    
    const totalScore = baseScore + bonusScore;
    
    // Create new answer record
    const newAnswer = new Answer({
      userId,
      questionId: question._id,
      answer,
      timeTaken,
      score: totalScore,
      questionNumber,
      isCorrect
    });
    
    await newAnswer.save();
    
    // Update leaderboard
    let leaderboard = await Leaderboard.findOne({ userId });
    if (leaderboard) {
      leaderboard.score += totalScore;
      if (isCorrect) leaderboard.correctAnswers += 1;
      await leaderboard.save();
    } else {
      leaderboard = new Leaderboard({
        userId,
        score: totalScore,
        correctAnswers: isCorrect ? 1 : 0
      });
      await leaderboard.save();
    }
    
    // Update user status
    await User.findByIdAndUpdate(userId, { status: "active" });
    
    // Notify waiting room about user progress
    io.to('waitingRoom').emit('userProgress', { userId, status: "active" });
    
    return res.status(200).json({
      status: "success",
      score: totalScore,
      isCorrect
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// Get quiz state
exports.getQuizState = async (req, res) => {
    try {
      const { userId } = req.query;
  
      // Get quiz state
      let quizState = await QuizState.findOne();
  
      // Create default quiz state if not exists
      if (!quizState) {
        quizState = new QuizState();
        await quizState.save();
      }
  
      // Get participants for waiting room
      const participants = await User.find().select('name avatar status');
  
      // Count participants by status
      const waitingCount = participants.filter(p => p.status === 'waiting').length;
  
      // Calculate progress for each participant
      const participantsWithProgress = await Promise.all(
        participants.map(async (p) => ({
          id: p._id,
          name: p.name,
          avatar: p.avatar || "",
          status: p.status || "waiting",
          progress: p.status === "active" ? await calculateUserProgress(p._id) : 0
        }))
      );
  
      return res.status(200).json({
        status: "success",
        state: quizState.state,
        waitingCount,
        participants: participantsWithProgress
      });
    } catch (error) {
      console.error('Get quiz state error:', error);
      return res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  };

// Calculate user progress
const calculateUserProgress = async (userId) => {
  try {
    const totalQuestions = await Question.countDocuments();
    if (totalQuestions <= 0) return 0;
    
    const userAnswersCount = await Answer.countDocuments({ userId });
    return userAnswersCount / totalQuestions;
  } catch (error) {
    console.error('Calculate user progress error:', error);
    return 0;
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find()
      .sort('-score')
      .populate('userId', 'name avatar')
      .limit(50);
    
    return res.status(200).json({
      status: "success",
      leaderboard: leaderboard.map(entry => ({
        userId: entry.userId._id,
        name: entry.userId.name,
        score: entry.score,
        avatar: entry.userId.avatar || "",
        correctAnswers: entry.correctAnswers
      }))
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    
    await User.findByIdAndUpdate(userId, { status });
    
    // Notify waiting room about user status change
    io.to('waitingRoom').emit('userStatusUpdate', { userId, status });
    
    return res.status(200).json({
      status: "success",
      message: "User status updated"
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// Get user statistics
exports.getStatistics = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Count total questions
    const totalQuestions = await Question.countDocuments();
    
    // Get user answers
    const answers = await Answer.find({ userId });
    
    // Calculate statistics
    const answeredQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const incorrectAnswers = answeredQuestions - correctAnswers;
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const totalTime = answers.reduce((sum, answer) => sum + answer.timeTaken, 0);
    const avgTime = answeredQuestions > 0 ? (totalTime / answeredQuestions).toFixed(1) : "0.0";
    
    return res.status(200).json({
      status: "success",
      statistics: {
        userId,
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        incorrectAnswers,
        totalScore,
        avgTime
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// controllers/adminController.js
const QuizState = require('../models/QuizState');
const User = require('../models/User');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Leaderboard = require('../models/Leaderboard');
const io = require('../server').io;

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    // Find quiz state
    let quizState = await QuizState.findOne();
    
    // Create default quiz state if not exists
    if (!quizState) {
      quizState = new QuizState();
      await quizState.save();
      
      return res.status(200).json({
        status: "error",
        message: `Admin key belum diatur. Key baru: ${quizState.adminKey}`
      });
    }
    
    // Verify admin key
    if (adminKey !== quizState.adminKey) {
      return res.status(401).json({
        status: "error",
        message: "Admin key salah"
      });
    }
    
    // Get participants
    const participants = await User.find();
    
    return res.status(200).json({
      status: "success",
      message: "Login admin berhasil",
      state: quizState.state,
      participants: await Promise.all(participants.map(async p => ({
        id: p._id,
        name: p.name,
        avatar: p.avatar || "",
        status: p.status || "waiting",
        progress: p.status === "active" ? await calculateUserProgress(p._id) : 0
      })))
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// Start quiz
exports.startQuiz = async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    // Verify admin key
    const quizState = await QuizState.findOne();
    if (!quizState || adminKey !== quizState.adminKey) {
      return res.status(401).json({
        status: "error",
        message: "Admin key salah"
      });
    }
    
    // Update quiz state
    quizState.state = "started";
    quizState.startTime = new Date();
    await quizState.save();
    
    // Update all users to "active" status
    await User.updateMany({}, { status: "active" });
    
    // Notify all clients about quiz start
    io.emit('quizStateUpdate', { state: "started" });
    
    return res.status(200).json({
      status: "success",
      message: "Quiz dimulai"
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// End quiz
exports.endQuiz = async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    // Verify admin key
    const quizState = await QuizState.findOne();
    if (!quizState || adminKey !== quizState.adminKey) {
      return res.status(401).json({
        status: "error",
        message: "Admin key salah"
      });
    }
    
    // Update quiz state
    quizState.state = "finished";
    quizState.endTime = new Date();
    await quizState.save();
    
    // Update all users to "finished" status
    await User.updateMany({}, { status: "finished" });
    
    // Notify all clients about quiz end
    io.emit('quizStateUpdate', { state: "finished" });
    
    return res.status(200).json({
      status: "success",
      message: "Quiz diakhiri"
    });
  } catch (error) {
    console.error('End quiz error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// Reset quiz
exports.resetQuiz = async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    // Verify admin key
    const quizState = await QuizState.findOne();
    if (!quizState || adminKey !== quizState.adminKey) {
      return res.status(401).json({
        status: "error",
        message: "Admin key salah"
      });
    }
    
    // Update quiz state
    quizState.state = "waiting";
    quizState.startTime = null;
    quizState.endTime = null;
    await quizState.save();
    
    // Delete all answers
    await Answer.deleteMany({});
    
    // Delete all leaderboard entries
    await Leaderboard.deleteMany({});
    
    // Update all users to "waiting" status
    await User.updateMany({}, { status: "waiting" });
    
    // Notify all clients about quiz reset
    io.emit('quizStateUpdate', { state: "waiting" });
    
    return res.status(200).json({
      status: "success",
      message: "Quiz direset"
    });
  } catch (error) {
    console.error('Reset quiz error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};