import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    templeName: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Email for notifications
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

