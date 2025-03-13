// server/routes/quizRoutes.js
const express = require('express');
const {
  createQuiz,
  getQuizById,
  addQuestions,
  getQuizQuestions,
  getCurrentQuestion,
  getLeaderboard
} = require('../controllers/quizController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, adminOnly, createQuiz);
router.get('/:id', getQuizById);
router.post('/:id/questions', protect, adminOnly, addQuestions);
router.get('/:id/questions', protect, adminOnly, getQuizQuestions);
router.get('/:id/current-question', getCurrentQuestion);
router.get('/:id/leaderboard', getLeaderboard);

module.exports = router;