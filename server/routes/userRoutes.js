// server/routes/userRoutes.js
const express = require('express');
const {
  createParticipant,
  getQuizParticipants,
  getUserById  // Add this new import
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', createParticipant);
router.get('/quiz/:quizId', protect, adminOnly, getQuizParticipants);
router.get('/:id', getUserById);  // Add this new route

module.exports = router;