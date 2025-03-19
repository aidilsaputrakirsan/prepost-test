// server/scripts/fixDatabase.js
const mongoose = require('mongoose');
const config = require('../config/config');

async function fixDatabase() {
  try {
    console.log('===== PrePostTEST Database Fix Tool =====');
    console.log('Connecting to database:', config.mongoURI);
    
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    
    // 1. Fix questions collection - add questionId to questions that don't have it
    console.log('\nFixing questions collection...');
    const questionsCollection = mongoose.connection.db.collection('questions');
    
    // Find questions without questionId
    const questionsWithoutId = await questionsCollection.find({
      questionId: { $exists: false }
    }).toArray();
    
    console.log(`Found ${questionsWithoutId.length} questions without questionId`);
    
    // Add questionId to each question
    for (const question of questionsWithoutId) {
      await questionsCollection.updateOne(
        { _id: question._id },
        { $set: { questionId: new mongoose.Types.ObjectId().toString() } }
      );
    }
    
    console.log('Added questionId to all questions without one');
    
    // Check if index exists on questionId
    const questionIndexes = await questionsCollection.indexes();
    const hasQuestionIdIndex = questionIndexes.some(idx => 
      idx.key && idx.key.questionId !== undefined
    );
    
    if (!hasQuestionIdIndex) {
      console.log('Creating index on questionId field');
      await questionsCollection.createIndex({ questionId: 1 }, { unique: true });
      console.log('Created unique index on questionId');
    } else {
      console.log('Index on questionId already exists');
    }
    
    // 2. Check leaderboard collection
    console.log('\nChecking leaderboards collection...');
    const leaderboardsCollection = mongoose.connection.db.collection('leaderboards');
    
    const leaderboardCount = await leaderboardsCollection.countDocuments();
    console.log(`Found ${leaderboardCount} leaderboards`);
    
    // 3. Check quizzes with missing leaderboards
    console.log('\nChecking quizzes with missing leaderboards...');
    const quizCollection = mongoose.connection.db.collection('quizstates');
    const finishedQuizzes = await quizCollection.find({ 
      status: 'finished' 
    }).toArray();
    
    console.log(`Found ${finishedQuizzes.length} finished quizzes`);
    
    for (const quiz of finishedQuizzes) {
      const leaderboard = await leaderboardsCollection.findOne({ quiz: quiz._id });
      
      if (!leaderboard) {
        console.log(`Quiz ${quiz._id} is finished but has no leaderboard`);
      }
    }
    
    // 4. View answers collection
    console.log('\nChecking answers collection...');
    const answersCollection = mongoose.connection.db.collection('answers');
    const answerCount = await answersCollection.countDocuments();
    
    console.log(`Found ${answerCount} answers in total`);
    
    if (answerCount > 0) {
      const sampleAnswer = await answersCollection.findOne();
      console.log('Sample answer structure:');
      console.log(sampleAnswer);
    }
    
    console.log('\n===== Database Fix Complete =====');
    console.log('Your database structure has been fixed.');
    console.log('You can now restart your application to apply these changes.');
    
    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

// Run the fix
fixDatabase();