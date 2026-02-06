import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

export const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
};

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = { id: user._id.toString(), username: user.username, role: user.role, templeName: user.templeName };
    next();
  } catch (err) {
    console.error('JWT error', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

