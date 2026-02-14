import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/temple_meals';

async function testLogin(username, password) {
  console.log(`\nTesting login for user: ${username}`);
  console.log('Password:', password);
  
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000, family: 4 });
    console.log('✓ Connected to MongoDB');
    
    // Exact login logic from auth.js
    const user = await User.findOne({ username });
    console.log('User found:', !!user);
    
    if (!user) {
      console.log('✗ User not found - returning Invalid credentials');
      return;
    }
    
    console.log('User details:', { id: user._id, username: user.username, role: user.role });
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log('Password comparison result:', ok);
    
    if (!ok) {
      console.log('✗ Password mismatch - returning Invalid credentials');
    } else {
      console.log('✓ Login successful!');
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testLogin('admin', 'Admin@123456').catch(console.error);
