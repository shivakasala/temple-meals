import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import userRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';
import mealRoutes from './routes/meals.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/temple_meals';

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    email_user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    email_pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
    api_base_url: process.env.API_BASE_URL || 'NOT SET'
  });
});

// Debug endpoint: check admin emails and send a test email
app.get('/api/test-email', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const getTransporter = (await import('./utils/email.js')).default;

    const admins = await User.find({ role: 'admin' }).select('username email').lean();
    const adminEmails = admins.map(a => ({ username: a.username, email: a.email || '(NOT SET)' }));

    const transporter = getTransporter();
    let verifyResult = 'unknown';
    try {
      await transporter.verify();
      verifyResult = 'OK';
    } catch (err) {
      verifyResult = 'FAILED: ' + err.message;
    }

    let sendResult = 'skipped';
    const testTo = process.env.EMAIL_USER;
    if (testTo && verifyResult === 'OK') {
      try {
        await transporter.sendMail({
          from: testTo,
          to: testTo,
          subject: 'Render Email Test',
          html: '<h2>Email is working on Render!</h2><p>This is a test from your deployed backend.</p>'
        });
        sendResult = 'SENT to ' + testTo;
      } catch (err) {
        sendResult = 'FAILED: ' + err.message;
      }
    }

    res.json({ admins: adminEmails, transporter_verify: verifyResult, test_email: sendResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/meals', mealRoutes);

mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 })
  .then(() => {
    console.log('MongoDB connected to:', MONGO_URI);
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
    
    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});
