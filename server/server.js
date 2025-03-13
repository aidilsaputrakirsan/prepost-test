// server/server.js - VERSI DIPERBAIKI DENGAN CONFIG
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const path = require('path');
const config = require('./config/config');

// Ini tidak perlu lagi karena kita menggunakan config
// dotenv.config();

// Cek apakah config dimuat dengan benar
console.log('Environment:', config.nodeEnv);
console.log('PORT:', config.port);
console.log('MongoDB URI exists:', !!config.mongoURI);

// Routes
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const userRoutes = require('./routes/userRoutes');

// Socket handler
const setupSocketHandlers = require('./socket/socketHandler');

// Express app setup
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIO(server, {
  cors: {
    origin: config.nodeEnv === 'production'
      ? ['https://prepost-test.vercel.app']
      : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    if (!config.mongoURI) {
      throw new Error('mongoURI is undefined in config.');
    }
   
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Jangan langsung exit untuk development, izinkan server tetap berjalan
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/user', userRoutes);

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
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Jangan close server untuk development
  if (config.nodeEnv === 'production') {
    server.close(() => process.exit(1));
  }
});