import express from 'express';
import Setting from '../models/Setting.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// public for authenticated users to read current rates
router.get('/', authenticate, async (req, res) => {
  const setting = await Setting.findOne().sort({ createdAt: -1 }).lean();
  if (!setting) {
    return res.status(404).json({ message: 'Rates not configured yet' });
  }
  res.json({
    breakfastRate: setting.breakfastRate,
    lunchRate: setting.lunchRate,
    dinnerRate: setting.dinnerRate
  });
});

// admin-only to create/update rates
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { breakfastRate, lunchRate, dinnerRate } = req.body;
    if (
      breakfastRate == null ||
      lunchRate == null ||
      dinnerRate == null ||
      breakfastRate < 0 ||
      lunchRate < 0 ||
      dinnerRate < 0
    ) {
      return res.status(400).json({ message: 'All rates must be provided and non-negative' });
    }
    const setting = await Setting.create({ breakfastRate, lunchRate, dinnerRate });
    res.status(201).json(setting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save settings' });
  }
});

export default router;

