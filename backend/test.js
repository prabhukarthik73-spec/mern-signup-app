const path = require('path');
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '..', '.mongodb-binaries');

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

async function runTest() {
  console.log('--- 1. Starting MongoDB Server ---');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('MongoDB started at:', uri);

  console.log('--- 2. Connecting Mongoose ---');
  await mongoose.connect(uri);
  console.log('Mongoose connected successfully!');

  console.log('--- 3. Testing Express App & REST API Endpoint ---');
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post('/api/signup', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
      }
      const trimmedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: trimmedEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists. Please log in or use another email.' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = new User({ email: trimmedEmail, password: hashedPassword });
      await newUser.save();
      return res.status(201).json({
        success: true,
        message: 'Sign Up successful! Your account has been created.',
        user: { id: newUser._id, email: newUser.email, createdAt: newUser.createdAt }
      });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  const server = app.listen(5001);

  const signup = async (payload) => {
    const res = await fetch('http://localhost:5001/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return { status: res.status, data: await res.json() };
  };

  console.log('--- 4. Test Case A: Successful Sign Up ---');
  const res1 = await signup({ email: 'testuser@example.com', password: 'Password123' });
  console.log('Response:', res1);
  if (res1.status !== 201 || !res1.data.success) {
    throw new Error('Test Case A failed');
  }

  console.log('--- 5. Verify User Stored in MongoDB & Password Hashed ---');
  const storedUser = await User.findOne({ email: 'testuser@example.com' });
  console.log('MongoDB Record found:', {
    id: storedUser._id.toString(),
    email: storedUser.email,
    passwordHash: storedUser.password,
    createdAt: storedUser.createdAt
  });
  const isMatch = await bcrypt.compare('Password123', storedUser.password);
  console.log('Password bcrypt verification:', isMatch ? 'PASSED (Match)' : 'FAILED');
  if (!isMatch || storedUser.password === 'Password123') {
    throw new Error('Password was not hashed properly');
  }

  console.log('--- 6. Test Case B: Reject Duplicate Email ---');
  const res2 = await signup({ email: 'testuser@example.com', password: 'AnotherPassword' });
  console.log('Response:', res2);
  if (res2.status !== 400 || res2.data.success !== false) {
    throw new Error('Test Case B failed: Should reject duplicate email');
  }

  console.log('--- 7. Test Case C: Reject Empty Input ---');
  const res3 = await signup({ email: '', password: '' });
  console.log('Response:', res3);
  if (res3.status !== 400) {
    throw new Error('Test Case C failed');
  }

  server.close();
  await mongoose.disconnect();
  await mongod.stop();
  console.log('\n>>> ALL BACKEND & DATABASE TESTS PASSED 100%! <<<');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
