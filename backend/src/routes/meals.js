import express from 'express';
import MealCount from '../models/MealCount.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { nowUtc, calcEditableUntil, isEditable, isPastCutoffForNextDay, nextDayLocalDateString } from '../utils/time.js';
import { generateApprovalToken, sendRequestEmailToAdmin, sendConfirmationEmailToUser } from '../utils/email.js';

const router = express.Router();

const emailActionPage = (title, color, message) => `
  <html><body style="font-family:sans-serif;text-align:center;padding:60px;max-width:500px;margin:0 auto;">
    <h1 style="color:${color};">${title}</h1>
    <p style="font-size:16px;color:#333;">${message}</p>
  </body></html>
`;

// Email-based approval endpoint (no auth required -- uses its own approval token)
router.get('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.send(emailActionPage('Invalid Link', '#ef4444', 'This approval link is invalid.'));
    }

    const meal = await MealCount.findById(id);
    if (!meal) {
      return res.send(emailActionPage('Not Found', '#ef4444', 'This request no longer exists.'));
    }

    if (meal.mealStatus !== 'requested') {
      const already = meal.mealStatus === 'approved' ? 'Approved' : 'Rejected';
      const color = meal.mealStatus === 'approved' ? '#10b981' : '#ef4444';
      return res.send(emailActionPage(
        `Already ${already}`,
        color,
        `This request for <strong>${meal.userName}</strong> on <strong>${meal.date}</strong> has already been <strong>${already.toLowerCase()}</strong>. No further action needed.`
      ));
    }

    if (meal.approvalToken !== token) {
      return res.send(emailActionPage('Invalid Link', '#ef4444', 'This approval link is invalid or expired.'));
    }

    meal.mealStatus = 'approved';
    meal.approvalToken = null;
    meal.rejectionToken = null;
    await meal.save();

    const user = await User.findById(meal.userId);
    if (user && user.email) {
      await sendConfirmationEmailToUser(meal, user.email, 'approved');
    }

    res.send(emailActionPage(
      'Request Approved',
      '#10b981',
      `Prasadam request for <strong>${meal.userName}</strong> on <strong>${meal.date}</strong> has been approved. The user has been notified by email.`
    ));
  } catch (err) {
    console.error(err);
    res.send(emailActionPage('Error', '#ef4444', 'Something went wrong. Please try again or use the dashboard.'));
  }
});

// Email-based rejection endpoint (no auth required -- uses its own rejection token)
router.get('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.send(emailActionPage('Invalid Link', '#ef4444', 'This rejection link is invalid.'));
    }

    const meal = await MealCount.findById(id);
    if (!meal) {
      return res.send(emailActionPage('Not Found', '#ef4444', 'This request no longer exists.'));
    }

    if (meal.mealStatus !== 'requested') {
      const already = meal.mealStatus === 'approved' ? 'Approved' : 'Rejected';
      const color = meal.mealStatus === 'approved' ? '#10b981' : '#ef4444';
      return res.send(emailActionPage(
        `Already ${already}`,
        color,
        `This request for <strong>${meal.userName}</strong> on <strong>${meal.date}</strong> has already been <strong>${already.toLowerCase()}</strong>. No further action needed.`
      ));
    }

    if (meal.rejectionToken !== token) {
      return res.send(emailActionPage('Invalid Link', '#ef4444', 'This rejection link is invalid or expired.'));
    }

    meal.mealStatus = 'rejected';
    meal.approvalToken = null;
    meal.rejectionToken = null;
    await meal.save();

    const user = await User.findById(meal.userId);
    if (user && user.email) {
      await sendConfirmationEmailToUser(meal, user.email, 'rejected');
    }

    res.send(emailActionPage(
      'Request Rejected',
      '#ef4444',
      `Prasadam request for <strong>${meal.userName}</strong> on <strong>${meal.date}</strong> has been rejected. The user has been notified by email.`
    ));
  } catch (err) {
    console.error(err);
    res.send(emailActionPage('Error', '#ef4444', 'Something went wrong. Please try again or use the dashboard.'));
  }
});

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
    const {
      morningPrasadam = 0,
      eveningPrasadam = 0,
      userPhone,
      userTemple,
      category = 'IOS',
      date,
      fromDate,
      toDate
    } = req.body;
    
    if (morningPrasadam < 0 || eveningPrasadam < 0) {
      return res.status(400).json({ message: 'Counts must be non-negative' });
    }

    // Support single day or range booking
    let bookingDates = [];
    if (date) {
      // Frontend submits one record per day with range metadata.
      bookingDates = [date];
    } else if (fromDate && toDate) {
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
      // Generate tokens for email-based approval
      const approvalToken = generateApprovalToken();
      const rejectionToken = generateApprovalToken();

      const doc = await MealCount.create({
        userId: req.user.id,
        userName: req.user.username,
        userPhone,
        userTemple,
        date,
        fromDate: fromDate || date,
        toDate: toDate || date,
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

      // Send email to all admins asynchronously so request creation doesn't block.
      if (adminEmails.length > 0) {
        const baseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:4000';
        const approveLink = `${baseUrl}/api/meals/${doc._id}/approve?token=${approvalToken}`;
        const rejectLink = `${baseUrl}/api/meals/${doc._id}/reject?token=${rejectionToken}`;
        const mealObj = doc.toObject();

        Promise.all(
          adminEmails.map(email =>
            sendRequestEmailToAdmin(mealObj, email, approveLink, rejectLink)
          )
        )
          .then(async (results) => {
            if (results.some(Boolean)) {
 
              await MealCount.updateOne({ _id: doc._id }, { emailSent: true });
            }
          })
          .catch((emailErr) => {
            console.error('Async request email failed:', emailErr?.message || emailErr);
          });
      }

      createdDocs.push(doc);
    }

    res.status(201).json(createdDocs.length === 1 ? createdDocs[0] : createdDocs);
  } catch (err) {
    console.error(err);
    if (err.message === 'Rates not configured') {
      return res.status(400).json({ message: err.message });
    }
    // Return the underlying error message when available to aid debugging
    const msg = err.message || 'Failed to create meal request';
    res.status(500).json({ message: msg });
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
router.get('/admin', requireAdmin, async (req, res) => {
  const { date, userId } = req.query;
  const filter = {};
  if (date) filter.date = date;
  if (userId) filter.userId = userId;
  const items = await MealCount.find(filter).sort({ date: -1, createdAt: -1 }).lean();
  res.json(items);
});

// Get all meals (list) - admin only
router.get('/', requireAdmin, async (req, res) => {
  const items = await MealCount.find().sort({ date: -1, createdAt: -1 }).lean();
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
router.post('/:id/admin-meal-status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'requested'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const meal = await MealCount.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal request not found' });
    meal.mealStatus = status;
    await meal.save();

    if (status === 'approved' || status === 'rejected') {
      const user = await User.findById(meal.userId);
      if (user && user.email) {
        sendConfirmationEmailToUser(meal, user.email, status).catch(err =>
          console.error('Failed to send confirmation email:', err?.message)
        );
      }
    }

    res.json(meal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update meal status' });
  }
});

// Admin approves payment
router.post('/:id/admin-payment-status', requireAdmin, async (req, res) => {
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
router.get('/admin-summary', requireAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    const match = {};
    if (date) match.date = date;

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$date',
          // sum fields based on MealCount schema (morningPrasadam/eveningPrasadam)
          totalMorning: { $sum: '$morningPrasadam' },
          totalEvening: { $sum: '$eveningPrasadam' },
          // keep legacy fields for compatibility
          totalBreakfast: { $sum: '$morningPrasadam' },
          totalDinner: { $sum: '$eveningPrasadam' },
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
router.get('/admin-report', requireAdmin, async (req, res) => {
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

