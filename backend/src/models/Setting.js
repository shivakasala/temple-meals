import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    morningRate: { type: Number, required: true, min: 0 },
    eveningRate: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);

