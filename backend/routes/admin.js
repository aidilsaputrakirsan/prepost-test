// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Admin route working' });
});

// Routes
router.post('/login', adminController.adminLogin);
router.post('/start-quiz', adminController.startQuiz);
router.post('/end-quiz', adminController.endQuiz);
router.post('/reset-quiz', adminController.resetQuiz);

// Question management routes
router.get('/questions', adminController.getQuestions);
router.post('/questions', adminController.manageQuestions);
router.post('/delete-question', adminController.deleteQuestion);

module.exports = router;