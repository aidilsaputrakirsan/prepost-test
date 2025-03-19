// server/scripts/fixLeaderboard.js
const mongoose = require('mongoose');
const config = require('../config/config');

async function fixLeaderboard() {
  try {
    console.log('===== PrePostTEST Leaderboard Fix Tool =====');
    console.log('Connecting to database:', config.mongoURI);
    
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    
    // 1. Update the leaderboards collection
    console.log('\nFixing leaderboards collection...');
    const leaderboardsCollection = mongoose.connection.db.collection('leaderboards');
    
    // Get all leaderboards
    const leaderboards = await leaderboardsCollection.find().toArray();
    console.log(`Found ${leaderboards.length} leaderboards`);
    
    let fixedCount = 0;
    
    // Update each leaderboard's entries to include userId
    for (const leaderboard of leaderboards) {
      if (leaderboard.entries && leaderboard.entries.length > 0) {
        let needsUpdate = false;
        
        // Add userId to each entry if missing
        leaderboard.entries.forEach(entry => {
          if (!entry.userId && entry.user) {
            entry.userId = entry.user.toString();
            needsUpdate = true;
          }
        });
        
        // Update the leaderboard if changes were made
        if (needsUpdate) {
          await leaderboardsCollection.updateOne(
            { _id: leaderboard._id },
            { $set: { entries: leaderboard.entries } }
          );
          fixedCount++;
        }
      }
    }
    
    console.log(`Fixed ${fixedCount} leaderboards with missing userId values`);
    
    // 2. Check for duplicate indexes
    console.log('\nChecking for problematic indexes...');
    
    const indexes = await leaderboardsCollection.indexes();
    console.log('Current indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Find userId index if it exists
    const userIdIndex = indexes.find(index => index.key && index.key.userId);
    
    if (userIdIndex) {
      console.log('\nFound userId index. Checking for duplicates...');
      
      // If it's a unique index, we need to drop it and recreate as non-unique
      if (userIdIndex.unique) {
        console.log('Dropping unique userId index...');
        await leaderboardsCollection.dropIndex(userIdIndex.name);
        console.log('Creating non-unique userId index...');
        await leaderboardsCollection.createIndex({ userId: 1 }, { unique: false });
        console.log('Index updated successfully');
      } else {
        console.log('The userId index is already non-unique, no change needed');
      }
    } else {
      console.log('No userId index found - no action needed');
    }
    
    // 3. Clean up any null userId entries
    console.log('\nCleaning up null userId entries...');
    
    const nullUserIdQuery = { 'entries.userId': null };
    const hasNullUserIds = await leaderboardsCollection.countDocuments(nullUserIdQuery);
    
    if (hasNullUserIds > 0) {
      console.log(`Found ${hasNullUserIds} leaderboards with null userId values`);
      
      // For each leaderboard with null userIds
      const leaderboardsWithNullIds = await leaderboardsCollection.find(nullUserIdQuery).toArray();
      
      for (const leaderboard of leaderboardsWithNullIds) {
        // Filter out entries with null userId or add a generated one
        const fixedEntries = leaderboard.entries.map(entry => {
          if (!entry.userId) {
            return {
              ...entry,
              userId: entry.user ? entry.user.toString() : new mongoose.Types.ObjectId().toString()
            };
          }
          return entry;
        });
        
        // Update the leaderboard
        await leaderboardsCollection.updateOne(
          { _id: leaderboard._id },
          { $set: { entries: fixedEntries } }
        );
      }
      
      console.log(`Fixed ${leaderboardsWithNullIds.length} leaderboards with null userId values`);
    } else {
      console.log('No null userId entries found');
    }
    
    console.log('\n===== Leaderboard Fix Complete =====');
    console.log('Your leaderboards have been fixed.');
    console.log('You can now restart your application.');
    
    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing leaderboards:', error);
    process.exit(1);
  }
}

// Run the fix
fixLeaderboard();