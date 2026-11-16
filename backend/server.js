const path = require('path');
// Ensure mongodb-memory-server stores downloads within the workspace directory
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '..', '.mongodb-binaries');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/signup_db';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory fallback storage in case MongoDB server is starting up or offline
const fallbackUsers = [];

// Database connection
async function connectDB() {
  try {
    console.log(`[Database] Connecting to MongoDB at: ${MONGODB_URI} ...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('[Database] Successfully connected to MongoDB!');
  } catch (err) {
    console.warn(`[Database] Local MongoDB not reachable (${err.message}).`);
    console.log('[Database] Attempting In-Memory MongoDB fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const inMemoryUri = mongod.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`[Database] Connected to In-Memory MongoDB at: ${inMemoryUri}`);
    } catch (memErr) {
      console.warn('[Database] In-Memory MongoDB binary is downloading or not ready:', memErr.message);
      console.log('[Database] Graceful fallback enabled: Accounts will be hashed and verified in-memory until MongoDB connects.');
    }
  }
}

connectDB();

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  let userCount = fallbackUsers.length;
  if (isMongoConnected) {
    try {
      userCount = await User.countDocuments();
    } catch (_) {}
  }
  res.json({
    status: 'ok',
    database: isMongoConnected ? 'connected' : 'in-memory-fallback',
    registeredUsersCount: userCount,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/users - View all registered users in MongoDB
app.get('/api/users', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Fetch users from MongoDB (excluding password hash for clean display)
      const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
      return res.json({
        success: true,
        source: 'MongoDB',
        count: users.length,
        users,
      });
    } else {
      const users = fallbackUsers.map(({ password, ...u }) => u);
      return res.json({
        success: true,
        source: 'In-Memory Fallback',
        count: users.length,
        users,
      });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/signup - Register a new user
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Hash password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // If connected to MongoDB via Mongoose
    if (mongoose.connection.readyState === 1) {
      // Check if email already exists
      const existingUser = await User.findOne({ email: trimmedEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists. Please log in or use another email.',
        });
      }

      // Save to MongoDB
      const newUser = new User({
        email: trimmedEmail,
        password: hashedPassword,
      });
      await newUser.save();

      return res.status(201).json({
        success: true,
        message: 'Sign Up successful! Your account has been created.',
        user: {
          id: newUser._id,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      });
    } else {
      // In-Memory Fallback when MongoDB is offline
      const existing = fallbackUsers.find((u) => u.email === trimmedEmail);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists. Please log in or use another email.',
        });
      }

      const newUser = {
        id: 'user_' + Date.now(),
        email: trimmedEmail,
        password: hashedPassword,
        createdAt: new Date(),
      };
      fallbackUsers.push(newUser);

      return res.status(201).json({
        success: true,
        message: 'Sign Up successful! Your account has been created.',
        user: {
          id: newUser.id,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      });
    }
  } catch (error) {
    console.error('Error during sign up:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});

module.exports = { app, server };
