 
// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login route - creates new user or returns existing
router.post('/login', authController.login);

module.exports = router;