import express from 'express';
import MealCount from '../models/MealCount.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { nowUtc, calcEditableUntil, isEditable, isPastCutoffForNextDay, nextDayLocalDateString } from '../utils/time.js';
import { generateApprovalToken, sendRequestEmailToAdmin, sendConfirmationEmailToUser } from '../utils/email.js';

const router = express.Router();

router.use(authenticate);

// Helper to calculate bill on server to prevent tampering
const calculateBill = async ({ morningPrasadam, eveningPrasadam }) => {
  const s = await Setting.findOne().sort({ createdAt: -1 }).lean();
  if (!s) throw new Error('Rates not configured');
  const morning = s.morningRate || 0;
  const evening = s.eveningRate || 0;
  return (morningPrasadam || 0) * morning + (eveningPrasadam || 0) * evening;
};

// Create meal request for next day
router.post('/', async (req, res) => {
  try {
    const { morningPrasadam = 0, eveningPrasadam = 0, userPhone, userTemple, category = 'IOS', fromDate, toDate } = req.body;
    
    if (morningPrasadam < 0 || eveningPrasadam < 0) {
      return res.status(400).json({ message: 'Counts must be non-negative' });
    }

    // Support single day or range booking
    let bookingDates = [];
    if (fromDate && toDate) {
      // Multi-day booking
      const from = new Date(fromDate);
      const to = new Date(toDate);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        bookingDates.push(`${year}-${month}-${day}`);
      }
    } else {
      // Single day (next day)
      if (isPastCutoffForNextDay()) {
        return res.status(400).json({ message: '4 PM cutoff passed. Cannot create next-day request.' });
      }
      bookingDates = [nextDayLocalDateString()];
    }

    const createdAt = nowUtc();
    const editableUntil = calcEditableUntil(createdAt);
    const billAmount = await calculateBill({ morningPrasadam, eveningPrasadam });

    // Get all admin users for email
    const admins = await User.find({ role: 'admin' }).select('email');
    const adminEmails = admins.map(a => a.email).filter(e => e);

    // Create meal records for each day in range
    const createdDocs = [];
    for (const date of bookingDates) {
      const existing = await MealCount.findOne({ userId: req.user.id, date });
      if (existing) {
        continue; // Skip if already exists for this day
      }

      // Generate tokens for email-based approval
      const approvalToken = generateApprovalToken();
      const rejectionToken = generateApprovalToken();

      const doc = await MealCount.create({
        userId: req.user.id,
        userName: req.user.username,
        userPhone,
        userTemple,
        date,
        fromDate,
        toDate,
        morningPrasadam,
        eveningPrasadam,
        category,
        billAmount,
        mealStatus: 'requested',
        paymentStatus: 'pending',
        approvalToken,
        rejectionToken,
        emailSent: false,
        adminEmail: adminEmails[0],
        createdAt,
        editableUntil
      });

      // Send email to admins
      if (adminEmails.length > 0) {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const approveLink = `${baseUrl}/api/meals/${doc._id}/approve?token=${approvalToken}`;
        const rejectLink = `${baseUrl}/api/meals/${doc._id}/reject?token=${rejectionToken}`;

        // Send to first admin
        const emailSent = await sendRequestEmailToAdmin(doc.toObject(), adminEmails[0], approveLink, rejectLink);
        if (emailSent) {
          await MealCount.updateOne({ _id: doc._id }, { emailSent: true });
        }
      }

      createdDocs.push(doc);
    }

    res.status(201).json(createdDocs.length === 1 ? createdDocs[0] : createdDocs);
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

    const { morningPrasadam = meal.morningPrasadam, eveningPrasadam = meal.eveningPrasadam } = req.body;
    if (morningPrasadam < 0 || eveningPrasadam < 0) {
      return res.status(400).json({ message: 'Counts must be non-negative' });
    }

    const billAmount = await calculateBill({ morningPrasadam, eveningPrasadam });
    meal.morningPrasadam = morningPrasadam;
    meal.eveningPrasadam = eveningPrasadam;
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

// Email-based approval endpoint
router.get('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Invalid approval token' });
    }

    const meal = await MealCount.findById(id);
    if (!meal) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify token
    if (meal.approvalToken !== token) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update status
    meal.mealStatus = 'approved';
    await meal.save();

    // Send confirmation email to user
    const user = await User.findById(meal.userId);
    if (user && user.email) {
      await sendConfirmationEmailToUser(meal, user.email, 'approved');
    }

    res.json({ message: 'Request approved successfully', meal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to approve request' });
  }
});

// Email-based rejection endpoint
router.get('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Invalid rejection token' });
    }

    const meal = await MealCount.findById(id);
    if (!meal) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify token
    if (meal.rejectionToken !== token) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update status
    meal.mealStatus = 'rejected';
    await meal.save();

    // Send confirmation email to user
    const user = await User.findById(meal.userId);
    if (user && user.email) {
      await sendConfirmationEmailToUser(meal, user.email, 'rejected');
    }

    res.json({ message: 'Request rejected successfully', meal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reject request' });
  }
});

export default router;

