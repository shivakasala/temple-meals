import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

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

app.get('/api/test-email', async (req, res) => {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    const emailUser = process.env.EMAIL_USER;

    if (!resendKey) {
      return res.json({ success: false, error: 'RESEND_API_KEY not set. Sign up at resend.com and add the key.' });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(resendKey);
    const fromAddr = process.env.RESEND_FROM || 'Prasadam Portal <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromAddr,
      to: [emailUser || 'test@example.com'],
      subject: 'Render Email Test',
      html: '<h2>Email is working from Render!</h2><p>Timestamp: ' + new Date().toISOString() + '</p>'
    });

    if (error) return res.json({ success: false, error: error.message });
    res.json({ success: true, message: 'Test email sent to ' + emailUser, id: data?.id });
  } catch (err) {
    res.json({ success: false, error: err.message, code: err.code });
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
