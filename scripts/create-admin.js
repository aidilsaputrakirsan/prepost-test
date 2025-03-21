// create-simple-admin.js
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Make sure to install dotenv if you don't have it

async function createAdminUser() {
  // Get MongoDB URI from environment variable
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is not set.');
    console.log('Please create a .env file with your MONGODB_URI variable.');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Extract database name from the connection string
    const dbName = uri.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    
    // Reference the users collection
    const usersCollection = db.collection('users');
    
    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Update the admin user's password
      await usersCollection.updateOne(
        { email: 'admin@example.com' },
        { $set: { password: hashedPassword } }
      );
      
      console.log('Admin password updated successfully.');
    } else {
      console.log('Creating new admin user...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create admin user document
      const adminUser = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        isAdmin: true,
        createdAt: new Date()
      };
      
      // Insert the admin user
      await usersCollection.insertOne(adminUser);
      
      console.log('Admin user created successfully.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createAdminUser();