const mongoose = require('mongoose');
const { applyIdVirtual } = require('./_options');

const reviewSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    message: { type: String, default: '' },
    avatar: { type: String, default: '/user.png' },
    companyId: { type: String, required: true, index: true },
    tripId: { type: String, default: null, index: true },
    tripTitle: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    status: { type: String, enum: ['published', 'hidden', 'flagged'], default: 'published', index: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

reviewSchema.index({ companyId: 1, status: 1 });
applyIdVirtual(reviewSchema);

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
