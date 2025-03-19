// server/scripts/migrateData.js
const mongoose = require('mongoose');
const readline = require('readline');
const config = require('../config/config');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connection URIs for source databases 
// (replace with your actual passwords and connection info)
const testDbUri = 'mongodb+srv://aidilsaputrakirsan:MongoDBPassword123@preposttest.p3ovm.mongodb.net/test?retryWrites=true&w=majority';
const quizAppDbUri = 'mongodb+srv://aidilsaputrakirsan:MongoDBPassword123@preposttest.p3ovm.mongodb.net/quiz_app?retryWrites=true&w=majority';

// Target database is from your config (which now enforces a specific database name)
const targetDbUri = config.mongoURI;

// Store connections
let testDb, quizAppDb, targetDb;

async function connectToDatabases() {
  console.log('Connecting to databases...');
  
  try {
    // Connect to source databases
    testDb = await mongoose.createConnection(testDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to test database');
    
    quizAppDb = await mongoose.createConnection(quizAppDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to quiz_app database');
    
    // Connect to target database
    targetDb = await mongoose.createConnection(targetDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to target database:', targetDb.name);
    
    return true;
  } catch (error) {
    console.error('Error connecting to databases:', error);
    return false;
  }
}

async function getCollectionsList(db, dbName) {
  try {
    const collections = await db.db.listCollections().toArray();
    console.log(`\nCollections in ${dbName} database:`);
    
    if (collections.length === 0) {
      console.log('No collections found');
      return [];
    }
    
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    return collections.map(c => c.name);
  } catch (error) {
    console.error(`Error listing collections for ${dbName}:`, error);
    return [];
  }
}

async function migrateCollection(sourceDb, sourceDbName, collectionName, targetDb) {
  try {
    console.log(`\nMigrating collection "${collectionName}" from ${sourceDbName}...`);
    
    // Check if collection exists in target
    const targetCollections = await targetDb.db.listCollections({ name: collectionName }).toArray();
    const collectionExists = targetCollections.length > 0;
    
    if (collectionExists) {
      const count = await targetDb.db.collection(collectionName).countDocuments();
      console.log(`Collection already exists in target database with ${count} documents`);
      
      if (count > 0) {
        const answer = await askQuestion('Collection already has data. Do you want to replace it? (y/n): ');
        if (answer.toLowerCase() !== 'y') {
          console.log('Skipping collection');
          return false;
        }
        
        // Remove existing data
        await targetDb.db.collection(collectionName).deleteMany({});
        console.log('Existing data deleted');
      }
    }
    
    // Get data from source
    const documents = await sourceDb.db.collection(collectionName).find({}).toArray();
    console.log(`Found ${documents.length} documents to migrate`);
    
    if (documents.length === 0) {
      console.log('No documents to migrate');
      return true;
    }
    
    // Insert data into target
    const result = await targetDb.db.collection(collectionName).insertMany(documents);
    console.log(`Successfully migrated ${result.insertedCount} documents`);
    return true;
  } catch (error) {
    console.error(`Error migrating collection ${collectionName}:`, error);
    return false;
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdminUser() {
  try {
    console.log('\nChecking for admin user...');
    
    // Check if admin user already exists
    const adminUser = await targetDb.db.collection('users').findOne({ email: 'admin@example.com' });
    
    if (adminUser) {
      console.log('Admin user already exists in the database');
      return true;
    }
    
    // Create admin user if not exists
    console.log('Creating admin user...');
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    await targetDb.db.collection('users').insertOne({
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      isAdmin: true,
      createdAt: new Date()
    });
    
    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
}

async function run() {
  try {
    console.log('===== PrePostTEST Database Migration Tool =====');
    console.log('This script will migrate data from your test and quiz_app databases to a single database');
    
    const connected = await connectToDatabases();
    if (!connected) {
      console.error('Failed to connect to databases. Exiting...');
      process.exit(1);
    }
    
    // List collections in source databases
    const testCollections = await getCollectionsList(testDb, 'test');
    const quizAppCollections = await getCollectionsList(quizAppDb, 'quiz_app');
    
    // Migrate collections from test database
    console.log('\n===== Migrating from test database =====');
    for (const collection of testCollections) {
      await migrateCollection(testDb, 'test', collection, targetDb);
    }
    
    // Migrate collections from quiz_app database
    console.log('\n===== Migrating from quiz_app database =====');
    for (const collection of quizAppCollections) {
      await migrateCollection(quizAppDb, 'quiz_app', collection, targetDb);
    }
    
    // Create admin user if needed
    await createAdminUser();
    
    console.log('\n===== Migration Complete =====');
    console.log(`All data has been migrated to the ${targetDb.name} database`);
    console.log('You can now use your application with a single unified database');
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    rl.close();
    process.exit(1);
  }
}

// Start the migration
run();