// server/scripts/verifyDatabase.js
const mongoose = require('mongoose');
const config = require('../config/config');

async function verifyDatabase() {
  try {
    console.log('===== PrePostTEST Database Verification Tool =====');
    console.log('MongoDB URI:', config.mongoURI);
    
    // Connect to MongoDB
    console.log('\nConnecting to database...');
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected successfully!');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // List all collections
    console.log('\nListing collections:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('No collections found in database!');
    } else {
      console.log(`Found ${collections.length} collections:`);
      for (const collection of collections) {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        console.log(`- ${collection.name}: ${count} documents`);
      }
    }
    
    // Check for essential collections
    console.log('\nChecking essential collections:');
    const essentialCollections = ['users', 'quizstates', 'questions', 'answers', 'leaderboards'];
    
    for (const collName of essentialCollections) {
      const exists = collections.some(col => col.name === collName);
      if (exists) {
        const count = await mongoose.connection.db.collection(collName).countDocuments();
        console.log(`✓ ${collName}: ${count} documents`);
        
        // Print a sample document if collection is not empty
        if (count > 0) {
          const sample = await mongoose.connection.db.collection(collName).findOne();
          console.log(`  Sample document ID: ${sample._id}`);
        }
      } else {
        console.log(`✗ ${collName}: Not found! This collection is needed for the application.`);
      }
    }
    
    // Check for admin user
    console.log('\nChecking for admin user:');
    const adminUser = await mongoose.connection.db.collection('users').findOne({ isAdmin: true });
    
    if (adminUser) {
      console.log('✓ Admin user found:');
      console.log(`  ID: ${adminUser._id}`);
      console.log(`  Name: ${adminUser.name}`);
      console.log(`  Email: ${adminUser.email}`);
    } else {
      console.log('✗ No admin user found! You should create an admin user.');
    }
    
    // Check relationships
    console.log('\nChecking quiz and question relationships:');
    const quizzes = await mongoose.connection.db.collection('quizstates').find().toArray();
    
    if (quizzes.length > 0) {
      for (const quiz of quizzes) {
        console.log(`Quiz ID: ${quiz._id} (Status: ${quiz.status})`);
        console.log(`  Questions: ${quiz.questions ? quiz.questions.length : 0}`);
        console.log(`  Participants: ${quiz.participants ? quiz.participants.length : 0}`);
        
        // Check if questions exist
        if (quiz.questions && quiz.questions.length > 0) {
          const questionsSample = await mongoose.connection.db.collection('questions')
            .findOne({ _id: mongoose.Types.ObjectId(quiz.questions[0]) });
          
          if (questionsSample) {
            console.log('  ✓ Questions appear to be linked correctly');
          } else {
            console.log('  ✗ Questions are not linked correctly!');
          }
        }
      }
    } else {
      console.log('No quizzes found in database');
    }
    
    console.log('\n===== Verification Complete =====');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    return true;
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
}

// Run the verification
verifyDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });