import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../src/models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/temple_meals';

async function main() {
  console.log('Connecting to:', MONGO_URI);
  
  try {
    await mongoose.connect(MONGO_URI, { 
      serverSelectionTimeoutMS: 5000, 
      family: 4 
    });
    console.log('✓ Connected to MongoDB');
    
    const users = await User.find();
    console.log('Total users:', users.length);
    
    const admin = await User.findOne({ username: 'admin' });
    if (admin) {
      console.log('✓ Admin user found:');
      console.log('  ID:', admin._id);
      console.log('  Username:', admin.username);
      console.log('  Role:', admin.role);
      console.log('  Temple:', admin.templeName);
      console.log('  Password hash:', admin.passwordHash.substring(0, 20) + '...');
    } else {
      console.log('✗ Admin user NOT found');
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
