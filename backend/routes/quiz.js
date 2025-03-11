// routes/quiz.js
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Quiz route working' });
});

// Routes
router.get('/questions', quizController.getQuestions);
router.post('/submit-answer', quizController.submitAnswer);
router.get('/state', quizController.getQuizState);
router.get('/leaderboard', quizController.getLeaderboard);
router.post('/update-status', quizController.updateUserStatus);
router.get('/statistics', quizController.getStatistics);

module.exports = router;