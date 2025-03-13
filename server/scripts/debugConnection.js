// server/scripts/debugConnection.js
const mongoose = require('mongoose');
const config = require('../config/config');

const debugConnection = async () => {
  try {
    console.log('MongoDB URI:', config.mongoURI);
    
    // Extract database name from URI
    const dbName = config.mongoURI.split('/').pop().split('?')[0];
    console.log('Database name from URI:', dbName);
    
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB successfully');
    console.log('Current database:', mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in this database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Try to find the admin user
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const adminUser = await usersCollection.findOne({ isAdmin: true });
    
    if (adminUser) {
      console.log('Admin user found:');
      console.log('- ID:', adminUser._id);
      console.log('- Name:', adminUser.name);
      console.log('- Email:', adminUser.email);
      console.log('- isAdmin:', adminUser.isAdmin);
    } else {
      console.log('No admin user found in the users collection');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

debugConnection();