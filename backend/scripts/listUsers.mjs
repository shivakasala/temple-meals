import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../src/models/User.js';

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/templeDB';

async function run() {
  try {
    await mongoose.connect(MONGO, { family: 4 });
    const users = await User.find().select('username role templeName createdAt').lean();
    console.log(JSON.stringify(users, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
}

run();
