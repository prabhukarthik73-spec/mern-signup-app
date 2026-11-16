const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/signup_db';

async function showUsers() {
  console.log(`\n========================================`);
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
  console.log(`Database: signup_db | Collection: users`);
  console.log(`========================================\n`);

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('✓ Successfully connected to MongoDB!\n');

    const users = await User.find({}).sort({ createdAt: -1 });

    if (users.length === 0) {
      console.log('No users found in MongoDB yet. Sign up a user first!');
    } else {
      console.log(`Found ${users.length} registered user(s):\n`);

      const displayList = users.map((u, i) => ({
        '#': i + 1,
        'MongoDB _id': u._id.toString(),
        'Email': u.email,
        'Password (Hashed)': u.password.substring(0, 15) + '...',
        'Registered At': u.createdAt.toLocaleString(),
      }));

      console.table(displayList);
    }
  } catch (error) {
    console.error('Could not connect to MongoDB:', error.message);
    console.log('\nMake sure MongoDB service is running, or check your MONGODB_URI in backend/.env');
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database.');
  }
}

showUsers();
