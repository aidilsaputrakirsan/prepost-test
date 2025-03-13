// server/routes/userRoutes.js
const express = require('express');
const {
  createParticipant,
  getQuizParticipants
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', createParticipant);
router.get('/quiz/:quizId', protect, adminOnly, getQuizParticipants);

module.exports = router;