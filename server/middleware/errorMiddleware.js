// server/middleware/errorMiddleware.js
const config = require('../config/config');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error for debug in development
  if (config.nodeEnv === 'development') {
    console.error('ERROR:', err);
  } else {
    // In production, log minimal info
    console.error('ERROR:', err.message);
  }
  
  // If response is already sent, pass to next middleware
  if (res.headersSent) {
    return next(err);
  }

  // Get status code (default to 500)
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  // Format error response
  const errorResponse = {
    success: false,
    message: err.message || 'Server Error',
    stack: config.nodeEnv === 'production' ? null : err.stack
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Tidak ditemukan - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};