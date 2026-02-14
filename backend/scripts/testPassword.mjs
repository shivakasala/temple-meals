import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/temple_meals';
const testPassword = 'Admin@123456';

async function test() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000, family: 4 });
  
  const user = await User.findOne({ username: 'admin' });
  if (!user) {
    console.error('Admin user not found!');
    await mongoose.disconnect();
    process.exit(1);
  }
  
  console.log('\nTesting password verification:');
  console.log('Test password:', testPassword);
  console.log('Stored hash:', user.passwordHash);
  
  const matches = await bcrypt.compare(testPassword, user.passwordHash);
  console.log('Password matches:', matches);
  
  if (matches) {
    console.log('✓ Login should work!');
  } else {
    console.log('✗ Password mismatch - need to rehash');
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('New hash would be:', newHash);
  }
  
  await mongoose.disconnect();
}

test().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
