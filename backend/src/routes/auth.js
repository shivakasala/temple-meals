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
    console.log('[AUTH-DEBUG] Login attempt for username:', username);
    
    if (!username || !password) {
      console.log('[AUTH-DEBUG] Response: Missing credentials (400)');
      return res.status(400).json({ message: 'username and password are required' });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      console.log('[AUTH-DEBUG] User not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('[AUTH-DEBUG] User found:', username, 'with role:', user.role);
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log('[AUTH-DEBUG] Invalid password for user:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('[AUTH-DEBUG] Login successful for user:', username, 'Role:', user.role);
    const token = generateToken(user);
    
    const responsePayload = {
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        templeName: user.templeName
      }
    };
    
    console.log('[AUTH-DEBUG] Sending response:', {
      hasToken: !!responsePayload.token,
      hasUser: !!responsePayload.user,
      user: responsePayload.user
    });
    
    res.status(200).json(responsePayload);
  } catch (err) {
    console.error('[AUTH-DEBUG] Login error:', err.message, err.stack);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Current user profile
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;

