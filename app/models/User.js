// app/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ],
    sparse: true
  },
  password: {
    type: String,
    select: false
  },
  currentQuiz: {
    type: String,  
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

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Prevent model redefinition error in development
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;