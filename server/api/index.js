const express = require('express');
const mongoose = require('mongoose');
const config = require('../config/config');
const authRoutes = require('../routes/authRoutes');
const quizRoutes = require('../routes/quizRoutes');
const userRoutes = require('../routes/userRoutes');

// Connect to MongoDB
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const app = express();
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/quiz', quizRoutes);
app.use('/user', userRoutes);

module.exports = app;