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
    origin: config.nodeEnv === 'production'
      ? config.allowedOrigins
      : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: config.nodeEnv === 'production' ? config.allowedOrigins : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/user', userRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    stack: config.nodeEnv === 'production' ? null : err.stack
  });
});

// Setup Socket handlers
setupSocketHandlers(io);

// Serve static assets if in production
if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
 
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Server port
const PORT = config.port || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Don't close server for development
  if (config.nodeEnv === 'production') {
    server.close(() => process.exit(1));
  }
});

// Add these lines in your server.js file
if (process.env.NODE_ENV === 'production') {
  // Handle CORS for Vercel
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
      return res.status(200).json({});
    }
    next();
  });
  
  // Serve static files
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}