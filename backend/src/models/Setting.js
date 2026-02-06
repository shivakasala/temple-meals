import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    breakfastRate: { type: Number, required: true, min: 0 },
    lunchRate: { type: Number, required: true, min: 0 },
    dinnerRate: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);

