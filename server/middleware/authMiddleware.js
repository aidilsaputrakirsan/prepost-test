// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const config = require('../config/config');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    res.status(401);
    throw new Error('Akses ditolak, tidak ada token');
  }

  try {
    // Verify token using the JWT secret from config
    const decoded = jwt.verify(token, config.jwtSecret);

    // Get user from the token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      res.status(401);
      throw new Error('Pengguna tidak ditemukan');
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Token validation error:', error.message);
    res.status(401);
    throw new Error('Akses ditolak, token tidak valid');
  }
});

// Admin only middleware
exports.adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403);
    throw new Error('Akses ditolak, hanya admin yang diperbolehkan');
  }
});