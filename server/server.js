// server/server.js - VERSI LENGKAP YANG DIPERBAIKI
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config();

if (!process.env.MONGODB_URI) {
    console.log('Menggunakan environment variables hardcoded sementara');
    process.env.NODE_ENV = 'development';
    process.env.PORT = 5000;
    process.env.MONGODB_URI = 'mongodb+srv://aidilsaputrakirsan:MongoDBPassword123@preposttest.p3ovm.mongodb.net/?retryWrites=true&w=majority&appName=PrePostTEST';
    process.env.JWT_SECRET = 'preposttest_jwt_secret_key_123';
    process.env.JWT_EXPIRE = '30d';
  }

// Cek apakah variabel lingkungan dimuat dengan benar
console.log('Environment:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

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
    origin: process.env.NODE_ENV === 'production' 
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
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is undefined. Check your .env file.');
    }

    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Jangan langsung exit untuk development, izinkan server tetap berjalan
    if (process.env.NODE_ENV === 'production') {
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
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Server port
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Jangan close server untuk development
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1));
  }
});