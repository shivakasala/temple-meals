import express from 'express';
import MealCount from '../models/MealCount.js';
import Setting from '../models/Setting.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { nowUtc, calcEditableUntil, isEditable, isPastCutoffForNextDay, nextDayLocalDateString } from '../utils/time.js';

const router = express.Router();

router.use(authenticate);

// Helper to calculate bill on server to prevent tampering
const calculateBill = async ({ breakfast, lunch, dinner }) => {
  const s = await Setting.findOne().sort({ createdAt: -1 }).lean();
  if (!s) throw new Error('Rates not configured');
  return (
    (breakfast || 0) * s.breakfastRate +
    (lunch || 0) * s.lunchRate +
    (dinner || 0) * s.dinnerRate
  );
};

// Create meal request for next day
router.post('/', async (req, res) => {
  try {
    if (isPastCutoffForNextDay()) {
      return res.status(400).json({ message: '4 PM cutoff passed. Cannot create next-day request.' });
    }

    const { breakfast = 0, lunch = 0, dinner = 0 } = req.body;
    if (breakfast < 0 || lunch < 0 || dinner < 0) {
      return res.status(400).json({ message: 'Counts must be non-negative' });
    }

    const date = nextDayLocalDateString();

    const existing = await MealCount.findOne({ userId: req.user.id, date });
    if (existing) {
      return res.status(409).json({ message: 'Request for next day already exists. Edit existing one if allowed.' });
    }

    const createdAt = nowUtc();
    const editableUntil = calcEditableUntil(createdAt);
    const billAmount = await calculateBill({ breakfast, lunch, dinner });

    const doc = await MealCount.create({
      userId: req.user.id,
      userName: req.user.username,
      date,
      breakfast,
      lunch,
      dinner,
      billAmount,
      mealStatus: 'requested',
      paymentStatus: 'pending',
      createdAt,
      editableUntil
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    if (err.message === 'Rates not configured') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Failed to create meal request' });
  }
});

// Get current user's meal requests (optionally by date)
router.get('/mine', async (req, res) => {
  const { date } = req.query;
  const filter = { userId: req.user.id };
  if (date) filter.date = date;
  const items = await MealCount.find(filter).sort({ date: -1, createdAt: -1 }).lean();
  const withDerived = items.map((m) => ({
    ...m,
    editingAllowed: isEditable(m)
  }));
  res.json(withDerived);
});

// Admin: list all meals with optional filters
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  const { date, userId } = req.query;
  const filter = {};
  if (date) filter.date = date;
  if (userId) filter.userId = userId;
  const items = await MealCount.find(filter).sort({ date: -1, createdAt: -1 }).lean();
  res.json(items);
});

// User updates own meal request within 10 minutes and if still requested
router.put('/:id', async (req, res) => {
  try {
    const meal = await MealCount.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal request not found' });
    if (String(meal.userId) !== req.user.id) {
      return res.status(403).json({ message: 'Cannot edit others requests' });
    }
    if (!isEditable(meal)) {
      return res.status(400).json({ message: 'Editing window expired or request not in requested state' });
    }

    const { breakfast = meal.breakfast, lunch = meal.lunch, dinner = meal.dinner } = req.body;
    if (breakfast < 0 || lunch < 0 || dinner < 0) {
      return res.status(400).json({ message: 'Counts must be non-negative' });
    }

    const billAmount = await calculateBill({ breakfast, lunch, dinner });
    meal.breakfast = breakfast;
    meal.lunch = lunch;
    meal.dinner = dinner;
    meal.billAmount = billAmount; // server-side only
    await meal.save();
    res.json(meal);
  } catch (err) {
    console.error(err);
    if (err.message === 'Rates not configured') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Failed to update meal request' });
  }
});

// User marks payment done
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const meal = await MealCount.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal request not found' });
    if (String(meal.userId) !== req.user.id) {
      return res.status(403).json({ message: 'Cannot update others requests' });
    }
    if (meal.paymentStatus === 'payment-approved') {
      return res.status(400).json({ message: 'Payment already approved' });
    }
    meal.paymentStatus = 'paid';
    await meal.save();
    res.json(meal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark payment' });
  }
});

// Admin approves/rejects meal request (before preparation)
router.post('/:id/admin-meal-status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'requested'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const meal = await MealCount.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal request not found' });
    meal.mealStatus = status;
    await meal.save();
    res.json(meal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update meal status' });
  }
});

// Admin approves payment
router.post('/:id/admin-payment-status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['payment-approved', 'pending', 'paid'].includes(status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    const meal = await MealCount.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal request not found' });
    meal.paymentStatus = status;
    await meal.save();
    res.json(meal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update payment status' });
  }
});

// Admin dashboard summary: totals per day, total amount collected
router.get('/admin-summary', authenticate, requireAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    const match = {};
    if (date) match.date = date;

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$date',
          totalBreakfast: { $sum: '$breakfast' },
          totalLunch: { $sum: '$lunch' },
          totalDinner: { $sum: '$dinner' },
          totalAmount: { $sum: '$billAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const daily = await MealCount.aggregate(pipeline);

    const totalCollected = await MealCount.aggregate([
      { $match: { paymentStatus: 'payment-approved', ...(date ? { date } : {}) } },
      { $group: { _id: null, amount: { $sum: '$billAmount' } } }
    ]);

    res.json({
      daily,
      totalCollected: totalCollected[0]?.amount || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
});

// Admin daily report (basic JSON; can be exported to CSV client-side)
router.get('/admin-report', authenticate, requireAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'date (YYYY-MM-DD) is required' });
    }
    const items = await MealCount.find({ date }).populate('userId', 'username templeName').lean();
    res.json({ date, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch report' });
  }
});

export default router;

