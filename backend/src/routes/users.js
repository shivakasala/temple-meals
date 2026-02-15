import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

// Create user
router.post('/', async (req, res) => {
  try {
    const { username, password, templeName, role, email } = req.body;
    if (!username || !password || !templeName) {
      return res.status(400).json({ message: 'username, password, templeName are required' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      passwordHash,
      templeName,
      role: role === 'admin' ? 'admin' : 'user',
      email: email || undefined
    });
    res.status(201).json({
      id: user._id,
      username: user.username,
      templeName: user.templeName,
      role: user.role,
      email: user.email
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// List users
router.get('/', async (req, res) => {
  const users = await User.find().select('_id username templeName role email createdAt');
  res.json(users);
});

// Update user (without changing password, unless provided)
router.put('/:id', async (req, res) => {
  try {
    const { templeName, role, password, email } = req.body;
    const update = {};
    if (templeName) update.templeName = templeName;
    if (role) update.role = role === 'admin' ? 'admin' : 'user';
    if (typeof email !== 'undefined') update.email = email || undefined;
    if (password) {
      update.passwordHash = await bcrypt.hash(password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user._id,
      username: user.username,
      templeName: user.templeName,
      role: user.role,
      email: user.email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;


