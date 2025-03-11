// controllers/adminController.js
const QuizState = require('../models/QuizState');
const User = require('../models/User');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Leaderboard = require('../models/Leaderboard');
const io = require('../server').io;

// Fungsi untuk menghitung progress user (dipindahkan dari file quizController.js)
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