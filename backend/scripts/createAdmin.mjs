import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/temple_meals';

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'StrongPassword123';
const templeName = process.argv[4] || 'Main Temple';

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 });
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ username });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    existing.templeName = templeName;
    await existing.save();
    console.log(`Updated existing user '${username}' to admin and set new password.`);
  } else {
    await User.create({ username, passwordHash, templeName, role: 'admin' });
    console.log(`Created admin user '${username}'.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to create/update admin:', err);
  process.exit(1);
});
