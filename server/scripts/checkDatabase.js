// server/scripts/checkDatabase.js
const mongoose = require('mongoose');
const config = require('../config/config');

async function checkDatabase() {
  try {
    console.log('===== PrePostTEST Database Check =====');
    console.log('Checking MongoDB connection and collections...');
    console.log('MongoDB URI:', config.mongoURI);
    
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('\n✓ Connected successfully!');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n✓ Found ${collections.length} collections:`);
    
    // Check each collection
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
    }
    
    // Check for admin user
    const adminUser = await mongoose.connection.db.collection('users').findOne({ isAdmin: true });
    
    if (adminUser) {
      console.log('\n✓ Admin user found:');
      console.log(`  Name: ${adminUser.name}`);
      console.log(`  Email: ${adminUser.email}`);
    } else {
      console.log('\n✗ No admin user found!');
      console.log('  You should create an admin user using:');
      console.log('  npm run create-admin');
    }
    
    // Check quiz relationships
    const quizzes = await mongoose.connection.db.collection('quizstates').find().toArray();
    console.log(`\n✓ Found ${quizzes.length} quizzes`);
    
    if (quizzes.length > 0) {
      // Show the latest quiz
      const latestQuiz = quizzes[quizzes.length - 1];
      console.log('Latest quiz:');
      console.log(`  ID: ${latestQuiz._id}`);
      console.log(`  Status: ${latestQuiz.status}`);
      console.log(`  Questions: ${latestQuiz.questions ? latestQuiz.questions.length : 0}`);
      console.log(`  Participants: ${latestQuiz.participants ? latestQuiz.participants.length : 0}`);
    }
    
    console.log('\n===== Database Check Complete =====');
    console.log('Your database connection is working correctly!');
    
    // Close connection
    await mongoose.connection.close();
    
    return true;
  } catch (error) {
    console.error('\n✗ Database check failed:', error.message);
    console.error('Please check your MongoDB connection string and credentials.');
    return false;
  }
}

// Run the check
checkDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });