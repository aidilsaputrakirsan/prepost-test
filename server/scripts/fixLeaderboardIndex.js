// server/scripts/fixLeaderboardIndex.js
const mongoose = require('mongoose');
const config = require('../config/config');

async function fixLeaderboardIndex() {
  try {
    console.log('===== PrePostTEST Leaderboard Index Fix Tool =====');
    console.log('Connecting to database:', config.mongoURI);
    
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    
    // Get the leaderboards collection
    const leaderboardsCollection = mongoose.connection.db.collection('leaderboards');
    
    // List all indexes
    const indexes = await leaderboardsCollection.indexes();
    console.log('\nCurrent indexes on leaderboards collection:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Check for problematic userId index
    const userIdIndex = indexes.find(index => 
      index.key && index.key.userId === 1 && index.unique
    );
    
    if (userIdIndex) {
      console.log('\nFound problematic unique userId index');
      console.log('Dropping the index...');
      
      try {
        await leaderboardsCollection.dropIndex(userIdIndex.name);
        console.log('Index successfully dropped');
      } catch (dropError) {
        console.error('Error dropping index:', dropError);
      }
    } else {
      console.log('\nNo problematic unique userId index found');
    }
    
    // Check each leaderboard entry for userId
    console.log('\nChecking leaderboard entries...');
    const leaderboards = await leaderboardsCollection.find().toArray();
    console.log(`Found ${leaderboards.length} leaderboards`);
    
    let fixedEntries = 0;
    
    for (const leaderboard of leaderboards) {
      if (leaderboard.entries && Array.isArray(leaderboard.entries)) {
        let needsUpdate = false;
        
        // Process each entry
        leaderboard.entries.forEach(entry => {
          if (!entry.userId && entry.user) {
            entry.userId = entry.user.toString();
            needsUpdate = true;
            fixedEntries++;
          }
        });
        
        // Update if needed
        if (needsUpdate) {
          await leaderboardsCollection.updateOne(
            { _id: leaderboard._id },
            { $set: { entries: leaderboard.entries } }
          );
        }
      }
    }
    
    console.log(`Fixed ${fixedEntries} entries with missing userId values`);
    
    console.log('\n===== Leaderboard Index Fix Complete =====');
    console.log('Your leaderboard indexes have been fixed.');
    console.log('You can now restart your application.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing leaderboard indexes:', error);
    process.exit(1);
  }
}

// Run the fix
fixLeaderboardIndex();