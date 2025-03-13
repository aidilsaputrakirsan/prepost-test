// server/scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

// Create a schema that matches your User model
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  currentQuiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizState',
    default: null
  },
  score: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

// Admin user details
const adminUser = {
  name: 'Admin',
  email: 'admin@example.com',
  password: 'admin123',
  isAdmin: true
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
    
    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminUser.email });
    
    if (existingUser) {
      console.log('Admin user already exists.');
      return process.exit(0);
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);
    
    // Create admin user
    const user = await User.create({
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      isAdmin: adminUser.isAdmin
    });
    
    console.log('Admin user created successfully:');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${adminUser.password} (unhashed)`);
    console.log(`ID: ${user._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

connectDB();