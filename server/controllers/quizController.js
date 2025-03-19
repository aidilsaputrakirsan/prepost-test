// server/controllers/quizController.js
const QuizState = require('../models/QuizState');
const Question = require('../models/Question');
const User = require('../models/User');
const Answer = require('../models/Answer');
const Leaderboard = require('../models/Leaderboard');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Create a new quiz
// @route   POST /api/quiz
// @access  Private/Admin
exports.createQuiz = asyncHandler(async (req, res) => {
  try {
    // Get custom ID from request or generate random ID
    const customId = req.body.quizId || `quiz${Math.floor(Math.random() * 10000)}`;
    
    // Check if quiz with this ID already exists
    const existingQuiz = await QuizState.findById(customId);
    if (existingQuiz) {
      return res.status(400).json({
        success: false,
        message: `Quiz dengan ID ${customId} sudah ada. Silakan gunakan ID lain.`
      });
    }
    
    // Create a new quiz session in 'waiting' state
    const quiz = await QuizState.create({
      _id: customId,
      status: 'waiting',
      questions: req.body.questions || []
    });

    console.log('Quiz created successfully:', quiz);

    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({
      success: false,
      message: `Gagal membuat quiz: ${error.message}`
    });
  }
});

// @desc    Get quiz by ID
// @route   GET /api/quiz/:id
// @access  Public
exports.getQuizById = asyncHandler(async (req, res) => {
  try {
    const quizId = req.params.id;
    console.log('Getting quiz by ID:', quizId);
    
    // Find quiz by ID
    const quiz = await QuizState.findById(quizId)
      .populate('questions')
      .exec();

    if (!quiz) {
      console.log('Quiz not found:', quizId);
      return res.status(404).json({
        success: false,
        message: 'Quiz tidak ditemukan'
      });
    }

    console.log('Quiz found:', quiz._id);

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
  } catch (error) {
    console.error('Error getting quiz:', error);
    res.status(500).json({
      success: false,
      message: `Gagal mendapatkan quiz: ${error.message}`
    });
  }
});

// @desc    Add questions to quiz
// @route   POST /api/quiz/:id/questions
// @access  Private/Admin
exports.addQuestions = asyncHandler(async (req, res) => {
  try {
    const quizId = req.params.id;
    console.log('Adding questions to quiz:', quizId);
    
    const quiz = await QuizState.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz tidak ditemukan'
      });
    }

    // Only add questions if quiz is in 'waiting' state
    if (quiz.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menambahkan pertanyaan setelah quiz dimulai'
      });
    }

    // Validate questions format
    if (!req.body.questions || !Array.isArray(req.body.questions) || req.body.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Format pertanyaan tidak valid'
      });
    }

    // Add new questions
    const questions = await Promise.all(
      req.body.questions.map(async (q) => {
        if (!q.text || !q.options || q.options.length < 2) {
          throw new Error('Format pertanyaan tidak valid');
        }
        
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

    console.log(`${questions.length} questions added to quiz ${quizId}`);

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Error adding questions:', error);
    res.status(500).json({
      success: false,
      message: `Gagal menambahkan pertanyaan: ${error.message}`
    });
  }
});

// @desc    Get all questions for a quiz (admin only)
// @route   GET /api/quiz/:id/questions
// @access  Private/Admin
exports.getQuizQuestions = asyncHandler(async (req, res) => {
  try {
    const quizId = req.params.id;
    console.log('Getting questions for quiz:', quizId);
    
    const quiz = await QuizState.findById(quizId)
      .populate('questions')
      .exec();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz tidak ditemukan'
      });
    }

    console.log(`Found ${quiz.questions.length} questions for quiz ${quizId}`);

    res.status(200).json({
      success: true,
      data: quiz.questions
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    res.status(500).json({
      success: false,
      message: `Gagal mendapatkan pertanyaan: ${error.message}`
    });
  }
});

// @desc    Get current active question for a quiz
// @route   GET /api/quiz/:id/current-question
// @access  Public
exports.getCurrentQuestion = asyncHandler(async (req, res) => {
  try {
    const quiz = await QuizState.findById(req.params.id)
      .populate('questions')
      .exec();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz tidak ditemukan'
      });
    }

    if (quiz.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Quiz belum dimulai atau sudah selesai'
      });
    }

    const currentQuestion = quiz.questions[quiz.currentQuestionIndex];

    if (!currentQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Pertanyaan tidak ditemukan'
      });
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
  } catch (error) {
    console.error('Error getting current question:', error);
    res.status(500).json({
      success: false,
      message: `Gagal mendapatkan pertanyaan: ${error.message}`
    });
  }
});

// Replace the getLeaderboard function in server/controllers/quizController.js

// @desc    Get leaderboard for a quiz
// @route   GET /api/quiz/:id/leaderboard
// @access  Public
exports.getLeaderboard = asyncHandler(async (req, res) => {
  try {
    console.log(`Getting leaderboard for quiz: ${req.params.id}`);
    
    // First try to find an existing leaderboard
    let leaderboard = await Leaderboard.findOne({ quiz: req.params.id })
      .populate('entries.user', 'name')
      .exec();

    // If no leaderboard exists, calculate it on the fly
    if (!leaderboard) {
      console.log('No leaderboard found, calculating...');
      
      // Get quiz data
      const quiz = await QuizState.findById(req.params.id)
        .populate('questions participants')
        .exec();
      
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz tidak ditemukan'
        });
      }
      
      // Get all answers for this quiz
      const answers = await Answer.find({ quiz: req.params.id }).exec();
      console.log(`Found ${answers.length} answers for this quiz`);
      
      // Get all participants
      const participants = await User.find({ 
        _id: { $in: quiz.participants } 
      }).select('_id name score');
      
      console.log(`Found ${participants.length} participants`);
      
      // Calculate scores
      const entries = [];
      
      for (const participant of participants) {
        const userAnswers = answers.filter(answer => 
          answer.user.toString() === participant._id.toString()
        );
        
        const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
        const totalResponseTime = userAnswers.reduce((total, answer) => total + answer.responseTime, 0);
        const averageResponseTime = userAnswers.length > 0 ? totalResponseTime / userAnswers.length : 0;
        
        // Calculate score (correct answers * 100 + speed bonus)
        const baseScore = correctAnswers * 100;
        
        // Speed bonus for each correct answer
        const speedBonus = userAnswers.reduce((bonus, answer) => {
          if (answer.isCorrect) {
            // Get the question to find its time limit
            const question = quiz.questions.find(q => 
              q._id.toString() === answer.question.toString()
            );
            const timeLimit = question ? question.timeLimit * 1000 : 15000;
            
            // Faster answers get more bonus points (max 50)
            return bonus + Math.max(0, Math.round(50 * (1 - (answer.responseTime / timeLimit))));
          }
          return bonus;
        }, 0);
        
        const totalScore = baseScore + speedBonus;
        
        // Prepare entry with explicit userId field to prevent index errors
        const entry = {
          user: participant._id,
          userId: participant._id.toString(), // Add explicit userId field
          name: participant.name,
          score: totalScore,
          correctAnswers,
          totalQuestions: quiz.questions.length,
          averageResponseTime
        };
        
        entries.push(entry);
        
        // Update user's score in the database
        await User.findByIdAndUpdate(participant._id, { 
          score: totalScore,
          $set: { lastCorrectAnswers: correctAnswers }  // Store correct answers count
        });
      }
      
      // Sort by score (highest first)
      entries.sort((a, b) => b.score - a.score);
      
      // Create temporary leaderboard response
      leaderboard = {
        quiz: req.params.id,
        entries: entries
      };
      
      // Save the leaderboard for future requests
      try {
        await Leaderboard.create({
          quiz: req.params.id,
          entries: entries
        });
        console.log('Leaderboard saved to database');
      } catch (error) {
        console.warn('Could not save leaderboard:', error.message);
        // Continue anyway since we have the calculated leaderboard
      }
    } else {
      console.log('Found existing leaderboard');
      
      // Ensure all entries have the userId field to prevent index errors
      if (leaderboard.entries && Array.isArray(leaderboard.entries)) {
        let needsUpdate = false;
        
        leaderboard.entries.forEach(entry => {
          if (!entry.userId && entry.user) {
            entry.userId = entry.user.toString();
            needsUpdate = true;
          }
        });
        
        if (needsUpdate) {
          try {
            await leaderboard.save();
            console.log('Updated leaderboard entries with userId field');
          } catch (error) {
            console.warn('Could not update leaderboard with userId:', error.message);
          }
        }
      }
    }

    // Log the leaderboard structure for debugging
    console.log('Returning leaderboard data with structure:', 
      leaderboard && leaderboard.entries ? 
      `${leaderboard.entries.length} entries` : 
      'No entries found'
    );

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: `Gagal mendapatkan leaderboard: ${error.message}`
    });
  }
});

// Add this function to server/controllers/quizController.js

// @desc    Get all quizzes (admin only)
// @route   GET /api/quiz
// @access  Private/Admin
exports.getQuizzes = asyncHandler(async (req, res) => {
  try {
    // Get userId from authenticated user
    const userId = req.user._id;
    
    console.log('Getting all quizzes for admin:', userId);
    
    // Find all quizzes
    // In a real app, you might want to filter by the admin who created them
    const quizzes = await QuizState.find({})
      .select('_id status createdAt participants questions')
      .sort({ createdAt: -1 }) // Latest first
      .exec();
    
    // Format the quizzes for response
    const formattedQuizzes = quizzes.map(quiz => ({
      _id: quiz._id,
      status: quiz.status,
      createdAt: quiz.createdAt,
      participantCount: quiz.participants ? quiz.participants.length : 0,
      questionCount: quiz.questions ? quiz.questions.length : 0
    }));
    
    console.log(`Found ${formattedQuizzes.length} quizzes`);
    
    res.status(200).json({
      success: true,
      count: formattedQuizzes.length,
      data: formattedQuizzes
    });
  } catch (error) {
    console.error('Error getting quizzes:', error);
    res.status(500).json({
      success: false,
      message: `Gagal mendapatkan daftar quiz: ${error.message}`
    });
  }
});