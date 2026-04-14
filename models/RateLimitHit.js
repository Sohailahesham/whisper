import mongoose from 'mongoose';

const rateLimitHitSchema = new mongoose.Schema({
  key: { type: String, required: true },
  windowStart: { type: Date, required: true, expires: 3600 },
  count: { type: Number, default: 0 },
});

rateLimitHitSchema.index({ key: 1, windowStart: 1 }, { unique: true });

export const RateLimitHit = mongoose.model('RateLimitHit', rateLimitHitSchema);
