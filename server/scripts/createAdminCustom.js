// server/scripts/createAdminCustom.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

// Get database name from command line or use default
const dbName = process.argv[2] || 'prepost-test';

// Build the URI with the specified database
let uri = config.mongoURI;
if (uri.includes('mongodb+srv://')) {
  // If using MongoDB Atlas
  const parts = uri.split('/');
  // Replace the database name part
  if (parts.length > 3) {
    const queryPart = parts[3].includes('?') ? '?' + parts[3].split('?')[1] : '';
    parts[3] = dbName + queryPart;
    uri = parts.join('/');
  } else {
    // If no database name in the URI, add it
    uri = `${uri}/${dbName}`;
  }
} else {
  // If using local MongoDB
  const baseUri = uri.split('/').slice(0, 3).join('/');
  uri = `${baseUri}/${dbName}`;
}

// Create a schema that matches your User model
const UserSchema = new mongoose.Schema({
  name: String,
  isAdmin: Boolean,
  email: String,
  password: String,
  currentQuiz: mongoose.Schema.Types.ObjectId,
  score: Number,
  createdAt: Date
});

// Admin user details
const adminUser = {
  name: 'Admin',
  email: 'admin@example.com',
  password: 'admin123',
  isAdmin: true,
  createdAt: new Date()
};

console.log(`Connecting to database: ${dbName}`);
console.log(`Using connection URI: ${uri}`);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected to database: ${mongoose.connection.db.databaseName}`);
    
    // Create users collection if it doesn't exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);
    
    // Use direct database operations
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Check if admin user already exists
    const existingUser = await usersCollection.findOne({ email: adminUser.email });
    
    if (existingUser) {
      console.log('Admin user already exists:');
      console.log(existingUser);
      return process.exit(0);
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);
    
    // Create admin user
    const result = await usersCollection.insertOne({
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      isAdmin: adminUser.isAdmin,
      createdAt: adminUser.createdAt
    });
    
    console.log('Admin user created successfully:');
    console.log(`Name: ${adminUser.name}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminUser.password} (unhashed)`);
    console.log(`ID: ${result.insertedId}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();