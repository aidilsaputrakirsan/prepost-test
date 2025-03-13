// server/socket/socketHandler.js
const QuizState = require('../models/QuizState');
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Leaderboard = require('../models/Leaderboard');

module.exports = (io) => {
  // Store active quiz rooms
  const activeQuizzes = new Map();
  
  // Timer function for questions
  const startQuestionTimer = async (quizId, duration) => {
    let timeLeft = duration;
    
    const timerId = setInterval(() => {
      timeLeft -= 1;
      io.to(`quiz:${quizId}`).emit('timer', { timeLeft });
      
      if (timeLeft <= 0) {
        clearInterval(timerId);
        moveToNextQuestion(quizId);
      }
    }, 1000);
    
    // Store the timer ID so we can clear it if needed
    activeQuizzes.set(quizId, {
      ...activeQuizzes.get(quizId),
      timerId
    });
  };
  
  // Function to move to the next question
  const moveToNextQuestion = async (quizId) => {
    try {
      const quiz = await QuizState.findById(quizId)
        .populate('questions')
        .exec();
      
      if (!quiz) {
        return;
      }
      
      // Clear any existing timers
      if (activeQuizzes.has(quizId) && activeQuizzes.get(quizId).timerId) {
        clearInterval(activeQuizzes.get(quizId).timerId);
      }
      
      // Check if there are more questions
      if (quiz.currentQuestionIndex < quiz.questions.length - 1) {
        // Move to next question
        quiz.currentQuestionIndex += 1;
        await quiz.save();
        
        const nextQuestion = quiz.questions[quiz.currentQuestionIndex];
        
        // Emit the next question to all participants
        io.to(`quiz:${quizId}`).emit('question', {
          id: nextQuestion._id,
          text: nextQuestion.text,
          options: nextQuestion.options,
          timeLimit: nextQuestion.timeLimit,
          questionNumber: quiz.currentQuestionIndex + 1,
          totalQuestions: quiz.questions.length
        });
        
        // Start the timer for the next question
        startQuestionTimer(quizId, nextQuestion.timeLimit);
      } else {
        // End of quiz
        quiz.status = 'finished';
        quiz.endTime = new Date();
        await quiz.save();
        
        // Calculate and create leaderboard
        await calculateLeaderboard(quizId);
        
        // Notify all participants that the quiz has ended
        io.to(`quiz:${quizId}`).emit('quizEnded');
      }
    } catch (error) {
      console.error('Error moving to next question:', error);
    }
  };
  
  // Calculate leaderboard
  const calculateLeaderboard = async (quizId) => {
    try {
      const quiz = await QuizState.findById(quizId).populate('questions participants').exec();
      
      if (!quiz) {
        return;
      }
      
      // Get all answers for this quiz
      const answers = await Answer.find({ quiz: quizId }).exec();
      
      // Calculate scores for each participant
      const leaderboardEntries = await Promise.all(quiz.participants.map(async (user) => {
        const userAnswers = answers.filter(answer => answer.user.toString() === user._id.toString());
        
        const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
        const totalResponseTime = userAnswers.reduce((total, answer) => total + answer.responseTime, 0);
        const averageResponseTime = userAnswers.length > 0 ? totalResponseTime / userAnswers.length : 0;
        
        // Calculate score: (correct answers * 100) + speed bonus
        // Speed bonus decreases with slower response time
        const scoreBase = correctAnswers * 100;
        const speedBonus = userAnswers.reduce((bonus, answer) => {
          if (answer.isCorrect) {
            // Max bonus of 50 points for immediate answers (0ms)
            // Minimum bonus of 0 for answers at the time limit
            const timeLimit = quiz.questions.find(q => q._id.toString() === answer.question.toString()).timeLimit * 1000;
            return bonus + Math.max(0, 50 * (1 - (answer.responseTime / timeLimit)));
          }
          return bonus;
        }, 0);
        
        const totalScore = Math.round(scoreBase + speedBonus);
        
        // Update user's score
        await User.findByIdAndUpdate(user._id, { score: totalScore });
        
        return {
          user: user._id,
          name: user.name,
          score: totalScore,
          correctAnswers,
          totalQuestions: quiz.questions.length,
          averageResponseTime
        };
      }));
      
      // Sort entries by score (descending)
      leaderboardEntries.sort((a, b) => b.score - a.score);
      
      // Create or update leaderboard
      let leaderboard = await Leaderboard.findOne({ quiz: quizId });
      
      if (leaderboard) {
        leaderboard.entries = leaderboardEntries;
        await leaderboard.save();
      } else {
        leaderboard = await Leaderboard.create({
          quiz: quizId,
          entries: leaderboardEntries
        });
      }
      
      // Emit leaderboard to all participants
      io.to(`quiz:${quizId}`).emit('leaderboard', { entries: leaderboardEntries });
      
      return leaderboard;
    } catch (error) {
      console.error('Error calculating leaderboard:', error);
    }
  };
  
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // User joins waiting room
    socket.on('joinWaitingRoom', async ({ userId, quizId }) => {
      try {
        // Add user to quiz participants if not already there
        const quiz = await QuizState.findById(quizId);
        
        if (!quiz) {
          socket.emit('error', { message: 'Quiz tidak ditemukan' });
          return;
        }
        
        if (quiz.status !== 'waiting') {
          socket.emit('error', { message: 'Quiz sudah dimulai atau selesai' });
          return;
        }
        
        // Update user's current quiz
        await User.findByIdAndUpdate(userId, { currentQuiz: quizId });
        
        // Add user to participants if not already there
        if (!quiz.participants.includes(userId)) {
          quiz.participants.push(userId);
          await quiz.save();
        }
        
        // Join the socket room for this quiz
        socket.join(`quiz:${quizId}`);
        
        // Notify admin about the new participant
        const participants = await User.find({ _id: { $in: quiz.participants } }).select('name');
        io.to(`admin:${quizId}`).emit('participantsUpdate', { participants });
        
        // Notify the user they've joined successfully
        socket.emit('joinedWaitingRoom', { quizId });
        
        console.log(`User ${userId} joined waiting room for quiz ${quizId}`);
      } catch (error) {
        console.error('Error joining waiting room:', error);
        socket.emit('error', { message: 'Gagal bergabung dengan ruang tunggu' });
      }
    });
    
    // Admin starts the quiz
    socket.on('startQuiz', async ({ quizId, adminId }) => {
      try {
        const quiz = await QuizState.findById(quizId)
          .populate('questions')
          .exec();
        
        if (!quiz) {
          socket.emit('error', { message: 'Quiz tidak ditemukan' });
          return;
        }
        
        // Update quiz status
        quiz.status = 'active';
        quiz.startTime = new Date();
        quiz.currentQuestionIndex = 0;
        await quiz.save();
        
        // Get the first question
        const firstQuestion = quiz.questions[0];
        
        if (!firstQuestion) {
          socket.emit('error', { message: 'Tidak ada pertanyaan dalam quiz' });
          return;
        }
        
        // Join admin to admin room
        socket.join(`admin:${quizId}`);
        
        // Emit 'quizStarted' event to all participants
        io.to(`quiz:${quizId}`).emit('quizStarted', { quizId });
        
        // Send the first question after a short delay
        setTimeout(() => {
          io.to(`quiz:${quizId}`).emit('question', {
            id: firstQuestion._id,
            text: firstQuestion.text,
            options: firstQuestion.options,
            timeLimit: firstQuestion.timeLimit,
            questionNumber: 1,
            totalQuestions: quiz.questions.length
          });
          
          // Start the timer for the first question
          startQuestionTimer(quizId, firstQuestion.timeLimit);
        }, 3000); // 3 second delay to prepare participants
        
        console.log(`Quiz ${quizId} started by admin ${adminId}`);
      } catch (error) {
        console.error('Error starting quiz:', error);
        socket.emit('error', { message: 'Gagal memulai quiz' });
      }
    });
    
    // User submits an answer
    socket.on('submitAnswer', async ({ userId, quizId, questionId, selectedOption, responseTime }) => {
      try {
        // Find the question to check if the answer is correct
        const question = await Question.findById(questionId);
        
        if (!question) {
          socket.emit('error', { message: 'Pertanyaan tidak ditemukan' });
          return;
        }
        
        const isCorrect = selectedOption === question.correctOption;
        
        // Save the answer
        const answer = await Answer.create({
          user: userId,
          quiz: quizId,
          question: questionId,
          selectedOption,
          isCorrect,
          responseTime
        });
        
        // Send back result to user
        socket.emit('answerResult', {
          isCorrect,
          correctOption: question.correctOption
        });
        
        console.log(`User ${userId} answered question ${questionId} in quiz ${quizId}`);
      } catch (error) {
        console.error('Error submitting answer:', error);
        socket.emit('error', { message: 'Gagal mengirim jawaban' });
      }
    });
    
    // Admin stops the quiz
    socket.on('stopQuiz', async ({ quizId, adminId }) => {
      try {
        const quiz = await QuizState.findById(quizId);
        
        if (!quiz) {
          socket.emit('error', { message: 'Quiz tidak ditemukan' });
          return;
        }
        
        // Clear timer if exists
        if (activeQuizzes.has(quizId) && activeQuizzes.get(quizId).timerId) {
          clearInterval(activeQuizzes.get(quizId).timerId);
        }
        
        // Update quiz status
        quiz.status = 'finished';
        quiz.endTime = new Date();
        await quiz.save();
        
        // Calculate and create leaderboard
        await calculateLeaderboard(quizId);
        
        // Notify all participants that the quiz has been stopped
        io.to(`quiz:${quizId}`).emit('quizStopped');
        
        console.log(`Quiz ${quizId} stopped by admin ${adminId}`);
      } catch (error) {
        console.error('Error stopping quiz:', error);
        socket.emit('error', { message: 'Gagal menghentikan quiz' });
      }
    });
    
    // Admin resets the quiz
    socket.on('resetQuiz', async ({ quizId, adminId }) => {
      try {
        const quiz = await QuizState.findById(quizId);
        
        if (!quiz) {
          socket.emit('error', { message: 'Quiz tidak ditemukan' });
          return;
        }
        
        // Clear timer if exists
        if (activeQuizzes.has(quizId) && activeQuizzes.get(quizId).timerId) {
          clearInterval(activeQuizzes.get(quizId).timerId);
        }
        
        // Reset quiz state
        quiz.status = 'waiting';
        quiz.currentQuestionIndex = 0;
        quiz.startTime = null;
        quiz.endTime = null;
        await quiz.save();
        
        // Clear all answers for this quiz
        await Answer.deleteMany({ quiz: quizId });
        
        // Clear the leaderboard for this quiz
        await Leaderboard.deleteMany({ quiz: quizId });
        
        // Reset scores for all participants
        await User.updateMany(
          { _id: { $in: quiz.participants } },
          { score: 0 }
        );
        
        // Notify all participants that the quiz has been reset
        io.to(`quiz:${quizId}`).emit('quizReset');
        
        console.log(`Quiz ${quizId} reset by admin ${adminId}`);
      } catch (error) {
        console.error('Error resetting quiz:', error);
        socket.emit('error', { message: 'Gagal reset quiz' });
      }
    });
    
    // Admin removes a participant
    socket.on('removeParticipant', async ({ quizId, adminId, userId }) => {
      try {
        const quiz = await QuizState.findById(quizId);
        
        if (!quiz) {
          socket.emit('error', { message: 'Quiz tidak ditemukan' });
          return;
        }
        
        // Remove user from participants
        quiz.participants = quiz.participants.filter(
          (participant) => participant.toString() !== userId
        );
        await quiz.save();
        
        // Update user's current quiz
        await User.findByIdAndUpdate(userId, { currentQuiz: null });
        
        // Notify admin about updated participants list
        const participants = await User.find({ _id: { $in: quiz.participants } }).select('name');
        io.to(`admin:${quizId}`).emit('participantsUpdate', { participants });
        
        // Notify the user they've been removed
        io.to(`quiz:${quizId}`).emit('participantRemoved', { userId });
        
        console.log(`User ${userId} removed from quiz ${quizId} by admin ${adminId}`);
      } catch (error) {
        console.error('Error removing participant:', error);
        socket.emit('error', { message: 'Gagal menghapus peserta' });
      }
    });
    
    // User disconnects
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};