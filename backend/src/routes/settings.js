import express from 'express';
import Setting from '../models/Setting.js';

const router = express.Router();

// public to read current rates
router.get('/', async (req, res) => {
  const setting = await Setting.findOne().sort({ createdAt: -1 }).lean();
  if (!setting) {
    return res.status(404).json({ message: 'Rates not configured yet' });
  }
  res.json({
    morningRate: setting.morningRate,
    eveningRate: setting.eveningRate
  });
});

// public to create/update rates
router.post('/', async (req, res) => {
  try {
    const { morningRate, eveningRate } = req.body;
    if (
      morningRate == null ||
      eveningRate == null ||
      morningRate < 0 ||
      eveningRate < 0
    ) {
      return res.status(400).json({ message: 'Both morningRate and eveningRate must be provided and non-negative' });
    }
    const setting = await Setting.create({ morningRate, eveningRate });
    res.status(201).json(setting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save settings' });
  }
});

export default router;

