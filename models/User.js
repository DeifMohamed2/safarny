const mongoose = require('mongoose');
const { applyIdVirtual } = require('./_options');

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, trim: true },
    label: { type: String, trim: true },
    at: { type: Date, default: Date.now },
    meta: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const travelerSchema = new mongoose.Schema(
  {
    favoriteTripIds: { type: [String], default: [] },
    preferredDestinations: { type: [String], default: [] },
    language: { type: String, enum: ['en', 'ar'], default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
    },
    notes: { type: String, default: '' },
    activity: { type: [activitySchema], default: [] },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    avatar: { type: String, default: '/user.png' },
    userName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['traveler', 'company', 'admin'], default: 'traveler', index: true },
    companyId: { type: String, default: null, index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    city: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    lastLoginAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: null },
    traveler: { type: travelerSchema, default: () => ({}) },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });
applyIdVirtual(userSchema);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
