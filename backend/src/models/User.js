import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: false },
    googleId: { type: String, unique: true, sparse: true },
    templeName: { type: String, required: false, default: 'Default Temple' },
    email: { type: String, unique: true, sparse: true }, // Email for notifications and Google Login
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

