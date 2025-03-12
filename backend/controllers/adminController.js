// controllers/adminController.js
const QuizState = require('../models/QuizState');
const User = require('../models/User');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Leaderboard = require('../models/Leaderboard');
const socketIO = require('../socket'); // Import our socket module

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
    try {
      const io = socketIO.getIO();
      io.emit('quizStateUpdate', { state: "started" });
    } catch (err) {
      console.warn('Socket error in startQuiz:', err.message);
    }
    
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
    try {
      const io = socketIO.getIO();
      io.emit('quizStateUpdate', { state: "finished" });
    } catch (err) {
      console.warn('Socket error in endQuiz:', err.message);
    }
    
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
    try {
      const io = socketIO.getIO();
      io.emit('quizStateUpdate', { state: "waiting" });
    } catch (err) {
      console.warn('Socket error in resetQuiz:', err.message);
    }
    
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

// Add a new endpoint to create or edit questions
exports.manageQuestions = async (req, res) => {
  try {
    const { adminKey, questions } = req.body;
    
    // Verify admin key
    const quizState = await QuizState.findOne();
    if (!quizState || adminKey !== quizState.adminKey) {
      return res.status(401).json({
        status: "error",
        message: "Admin key salah"
      });
    }
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Format pertanyaan tidak valid. Diperlukan array pertanyaan."
      });
    }
    
    // Process each question
    const results = [];
    for (const q of questions) {
      // Validate question data
      if (!q.question || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.correctAnswer) {
        results.push({
          status: "error",
          message: "Data pertanyaan tidak lengkap",
          data: q
        });
        continue;
      }
      
      try {
        // If question has ID, update existing question
        if (q.questionId) {
          const question = await Question.findOne({ questionId: q.questionId });
          if (question) {
            Object.assign(question, q);
            await question.save();
            results.push({
              status: "success",
              message: "Pertanyaan diperbarui",
              questionId: q.questionId
            });
          } else {
            // Create new with specific ID
            const newQuestion = new Question(q);
            await newQuestion.save();
            results.push({
              status: "success",
              message: "Pertanyaan baru dibuat dengan ID yang ditentukan",
              questionId: q.questionId
            });
          }
        } else {
          // Create new question with auto-incremented ID
          const lastQuestion = await Question.findOne().sort({ questionId: -1 });
          const newId = lastQuestion ? lastQuestion.questionId + 1 : 1;
          
          const newQuestion = new Question({
            ...q,
            questionId: newId
          });
          
          await newQuestion.save();
          results.push({
            status: "success",
            message: "Pertanyaan baru dibuat",
            questionId: newId
          });
        }
      } catch (error) {
        results.push({
          status: "error",
          message: error.message,
          data: q
        });
      }
    }
    
    return res.status(200).json({
      status: "success",
      message: "Operasi manajemen pertanyaan selesai",
      results
    });
  } catch (error) {
    console.error('Manage questions error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// Get all questions for admin
exports.getQuestions = async (req, res) => {
  try {
    const { adminKey } = req.query;
    
    // Verify admin key
    const quizState = await QuizState.findOne();
    if (!quizState || adminKey !== quizState.adminKey) {
      return res.status(401).json({
        status: "error",
        message: "Admin key salah"
      });
    }
    
    // Get all questions with full details
    const questions = await Question.find().sort({ questionId: 1 });
    
    return res.status(200).json({
      status: "success",
      questions: questions.map(q => ({
        id: q._id,
        questionId: q.questionId,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer
      }))
    });
  } catch (error) {
    console.error('Get admin questions error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { adminKey, questionId } = req.body;
    
    // Verify admin key
    const quizState = await QuizState.findOne();
    if (!quizState || adminKey !== quizState.adminKey) {
      return res.status(401).json({
        status: "error",
        message: "Admin key salah"
      });
    }
    
    // Find and delete question
    const question = await Question.findOne({ questionId });
    if (!question) {
      return res.status(404).json({
        status: "error",
        message: `Pertanyaan dengan ID ${questionId} tidak ditemukan`
      });
    }
    
    await question.deleteOne();
    
    return res.status(200).json({
      status: "success",
      message: `Pertanyaan dengan ID ${questionId} berhasil dihapus`
    });
  } catch (error) {
    console.error('Delete question error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};