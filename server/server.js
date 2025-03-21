// server/server.js
const express = require('express');
const http = require('http');
const https = require('https');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const path = require('path');
const config = require('./config/config');

// Routes
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const userRoutes = require('./routes/userRoutes');

// Socket handler
const setupSocketHandlers = require('./socket/socketHandler');

// Create Express app
const app = express();
const server = http.createServer(app);

// Socket.io setup untuk Render
const io = socketIO(server, {
  cors: {
    origin: [
      'http://localhost:3000', 
      'https://aidilsaputrakirsan.github.io'
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Penting: Dukung kedua transport methods
});

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
    
    // Izinkan permintaan tanpa origin (misal dari Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('Origin ditolak oleh CORS:', origin);
      callback(null, true); // Untuk debugging, izinkan semua origin
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Database connection with retry
const connectDB = async () => {
  const MAX_RETRIES = 5;
  let retries = 0;
  let connected = false;

  while (!connected && retries < MAX_RETRIES) {
    try {
      console.log(`MongoDB connection attempt ${retries + 1}...`);
      
      if (!config.mongoURI) {
        throw new Error('MongoDB URI is undefined in config');
      }
      
      await mongoose.connect(config.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      });
      
      console.log('MongoDB connected successfully');
      connected = true;
    } catch (err) {
      retries++;
      console.error(`MongoDB connection error (attempt ${retries}):`, err.message);
      
      if (retries < MAX_RETRIES) {
        console.log(`Retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      } else {
        console.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
        
        // Don't exit in development mode
        if (config.nodeEnv === 'production') {
          console.warn('Running without database connection. Some features will not work.');
        }
      }
    }
  }
};

// Connect to database
connectDB();

// Health check endpoint
app.get('/healthcheck', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/user', userRoutes);

// Setup Socket handlers
setupSocketHandlers(io);

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    stack: config.nodeEnv === 'production' ? null : err.stack
  });
});

// Server port
const PORT = process.env.PORT || config.port || 5000;

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
});

// Keep-alive function untuk Back4App Free Tier
const keepAlive = () => {
  setInterval(() => {
    console.log("Mengirim ping keep-alive...");
    const appUrl = process.env.RENDER_EXTERNAL_URL || 'https://your-app-name.onrender.com';
    https.get(`${appUrl}/healthcheck`, (res) => {
      console.log(`Keep-alive status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('Keep-alive request error:', err.message);
    });
  }, 840000); // 14 menit (Render free tier timeout pada 15 menit)
};

// Aktifkan keep-alive di production
if (process.env.NODE_ENV === 'production') {
  keepAlive();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Log error only but keep the server running
  console.error(err);
});