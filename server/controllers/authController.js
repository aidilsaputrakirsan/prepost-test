// server/controllers/authController.js
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');

// @desc    Register admin
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if admin with email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('Email sudah terdaftar');
  }

  // Create admin user
  const user = await User.create({
    name,
    email,
    password,
    isAdmin: true
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: user.getSignedJwtToken()
    });
  } else {
    res.status(400);
    throw new Error('Data admin tidak valid');
  }
});

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    res.status(400);
    throw new Error('Masukkan email dan password');
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Email atau password salah');
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Email atau password salah');
  }

  // Check if user is admin
  if (!user.isAdmin) {
    res.status(401);
    throw new Error('Akses ditolak, anda bukan admin');
  }

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    token: user.getSignedJwtToken()
  });
});