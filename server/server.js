// server/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const config = require('./config/config');

// Routes
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const userRoutes = require('./routes/userRoutes');

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced CORS for production
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://aidilsaputrakirsan.github.io'
    ];
    
    // Add Vercel URL to allowed origins
    if (process.env.VERCEL_URL) {
      allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
    }
    
    // Add prepost-test.vercel.app
    allowedOrigins.push('https://prepost-test.vercel.app');
    
    // Allow requests without origin (like Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('Origin rejected by CORS:', origin);
      callback(null, true); // For debugging, allow all origins
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Database connection with retry logic for regular environments
// In serverless, we'll connect for each request
const connectDB = async () => {
  if (mongoose.connection.readyState) {
    return; // Already connected
  }

  try {
    if (!config.mongoURI) {
      throw new Error('MongoDB URI is undefined in config');
    }
    
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error(`MongoDB connection error:`, err.message);
    throw err; // Propagate error for serverless error handling
  }
};

// Health check endpoint
app.get('/healthcheck', async (req, res) => {
  // Connect to DB for each request in serverless
  if (process.env.VERCEL) {
    try {
      await connectDB();
    } catch (err) {
      console.error('DB connection failed during healthcheck');
      // Continue anyway to show the status
    }
  }

  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    service: 'PrePostTEST API',
    hosting: process.env.VERCEL ? 'Vercel' : 'Server',
    mongodb: mongoose.connection.readyState ? 'connected' : 'disconnected',
    project: process.env.VERCEL_URL || 'local'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/user', userRoutes);

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    stack: config.nodeEnv === 'production' ? null : err.stack
  });
});

// For local development, start the server normally
if (!process.env.VERCEL) {
  // Connect to database
  connectDB();
  
  // Server port
  const PORT = process.env.PORT || config.port || 3000;
  
  // Create HTTP server and Socket.io setup ONLY for non-Vercel environment
  const http = require('http');
  const socketIO = require('socket.io');
  const setupSocketHandlers = require('./socket/socketHandler');
  
  const server = http.createServer(app);
  
  const io = socketIO(server, {
    cors: {
      origin: [
        'http://localhost:3000', 
        'https://aidilsaputrakirsan.github.io'
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });
  
  // Setup Socket handlers
  setupSocketHandlers(io);
  
  // Start the server
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    console.error(err);
  });
} else {
  // In Vercel, we'll connect to MongoDB for each request
  // This runs before each API route in the serverless environment
  app.use(async (req, res, next) => {
    if (!req.path.startsWith('/_next') && !req.path.startsWith('/static')) {
      try {
        await connectDB();
      } catch (err) {
        console.error('Failed to connect to database in middleware:', err);
        // Continue anyway - let the route handlers deal with it
      }
    }
    next();
  });
}

// Export for Vercel serverless environment
module.exports = app;