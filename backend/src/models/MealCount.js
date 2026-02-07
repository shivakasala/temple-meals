import mongoose from 'mongoose';

const mealCountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userPhone: { type: String },
    userTemple: { type: String },
    date: { type: String, required: true }, // YYYY-MM-DD (temple local date)
    fromDate: { type: String }, // YYYY-MM-DD for range bookings
    toDate: { type: String }, // YYYY-MM-DD for range bookings
    breakfast: { type: Number, default: 0, min: 0 },
    lunch: { type: Number, default: 0, min: 0 },
    dinner: { type: Number, default: 0, min: 0 },
    category: { 
      type: String, 
      enum: ['IOS', 'COMMUNITY'],
      default: 'IOS'
    },
    billAmount: { type: Number, required: true, min: 0 },
    mealStatus: {
      type: String,
      enum: ['requested', 'approved', 'rejected'],
      default: 'requested'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'payment-approved'],
      default: 'pending'
    },
    createdAt: { type: Date, default: () => new Date(), immutable: true },
    editableUntil: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model('MealCount', mealCountSchema);

