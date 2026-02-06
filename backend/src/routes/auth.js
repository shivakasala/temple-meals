import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Seed first admin if no users exist (one-time bootstrap)
router.post('/bootstrap-admin', async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return res.status(400).json({ message: 'Users already exist' });
    }
    const { username, password, templeName } = req.body;
    if (!username || !password || !templeName) {
      return res.status(400).json({ message: 'username, password, and templeName are required' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash, templeName, role: 'admin' });
    res.status(201).json({ id: user._id, username: user.username, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to bootstrap admin' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        templeName: user.templeName
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Current user profile
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;

