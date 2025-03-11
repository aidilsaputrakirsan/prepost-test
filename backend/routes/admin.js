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

module.exports = router;