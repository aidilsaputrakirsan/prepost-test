// server/server.js
const express = require('express');
const http = require('http');
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

// Socket.io setup
const io = socketIO(server, {
  cors: {
    origin: [
      'http://localhost:3000', 
      'https://aidilsaputrakirsan.github.io'
    ],
    credentials: true
  }
})

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced CORS for Vercel in production
if (config.nodeEnv === 'production') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
      return res.status(200).json({});
    }
    next();
  });
} else {
  // Development CORS
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'https://aidilsaputrakirsan.github.io'
    ],
    credentials: true
  }));
}

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
          process.exit(1);
        } else {
          console.warn('Running without database connection. Some features will not work.');
        }
      }
    }
  }
};

// Connect to database
connectDB();

// API Routes - these should come before the catch-all route
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

// Serve static assets in production - MUST come after API routes
if (config.nodeEnv === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // This must be the LAST route handler - catches all other requests
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Server port - use the provided port or default to 5000
const PORT = process.env.PORT || config.port || 5000;

// For Vercel serverless deployment - export the app
if (process.env.VERCEL) {
  // In Vercel environment, export the app
  module.exports = app;
} else {
  // For regular deployment, start the server
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Don't close server for development
  if (config.nodeEnv === 'production') {
    server.close(() => process.exit(1));
  }
});

// Tambahkan di bagian bawah file
app.get('/healthcheck', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Keep-alive function
const keepAlive = () => {
  setInterval(() => {
    console.log("Keeping the application alive...");
    const appUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : 'https://your-app-url.com';
    https.get(`${appUrl}/healthcheck`);
  }, 280000); // ~4.6 menit
};

// Aktifkan keep-alive
if (process.env.NODE_ENV === 'production') {
  keepAlive();
}