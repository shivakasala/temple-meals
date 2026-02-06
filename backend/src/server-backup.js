import dotenv from 'dotenv';

dotenv.config();
console.log(">>> MONGO_URI ACTUAL VALUE =", process.env.MONGO_URI);

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';
import mealRoutes from './routes/meals.js';

// #region agent log
const debugLogPath = path.resolve(process.cwd(), '..', '.cursor', 'debug.log');
const debugSessionId = 'debug-session';
const debugRunId = 'pre-fix';

function writeDebugLog(entry) {
  try {
    const dir = path.dirname(debugLogPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const line = JSON.stringify({
      sessionId: debugSessionId,
      runId: debugRunId,
      timestamp: Date.now(),
      ...entry
    });
    fs.appendFileSync(debugLogPath, line + '\n', { encoding: 'utf8' });
  } catch {
    // ignore logging errors
  }
}

process.on('uncaughtException', (err) => {
  writeDebugLog({
    hypothesisId: 'H6',
    location: 'src/server.js:34',
    message: 'Uncaught exception',
    data: { errorMessage: err?.message, stack: err?.stack }
  });
});

process.on('unhandledRejection', (reason) => {
  writeDebugLog({
    hypothesisId: 'H7',
    location: 'src/server.js:44',
    message: 'Unhandled promise rejection',
    data: { reasonMessage: reason?.message, reasonString: String(reason) }
  });
});
// #endregion agent log

const app = express();

// #region agent log
writeDebugLog({
  hypothesisId: 'H1',
  location: 'src/server.js:60',
  message: 'Server file loaded and app created',
  data: { hasEnv: !!process.env, envHasMongoUri: !!process.env.MONGO_URI }
});
// #endregion agent log

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/meals', mealRoutes);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/temple_meals';


// #region agent log
writeDebugLog({
  hypothesisId: 'H2',
  location: 'src/server.js:92',
  message: 'About to connect to MongoDB',
  data: { mongoUriPresent: !!MONGO_URI, port: PORT }
});
// #endregion agent log

mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 })
  .then(() => {
    console.log('MongoDB connected');

    // #region agent log
    writeDebugLog({
      hypothesisId: 'H3',
      location: 'src/server.js:103',
      message: 'MongoDB connected successfully',
      data: {}
    });
    // #endregion agent log

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);

      // #region agent log
      writeDebugLog({
        hypothesisId: 'H4',
        location: 'src/server.js:113',
        message: 'Express server listening',
        data: { port: PORT }
      });
      // #endregion agent log
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error', err);

    // #region agent log
    writeDebugLog({
      hypothesisId: 'H5',
      location: 'src/server.js:124',
      message: 'MongoDB connection error caught',
      data: { errorMessage: err?.message }
    });
    // #endregion agent log

    process.exit(1);
  });
