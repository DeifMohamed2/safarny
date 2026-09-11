const mongoose = require('mongoose');
const { applyIdVirtual } = require('./_options');

const proofSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    name: { type: String, default: '' },
    mime: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    bookingId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    tripId: { type: String, required: true, index: true },
    method: {
      type: String,
      enum: ['instapay', 'mobile_wallet', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer'],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    basePrice: { type: Number, default: 0 },
    markupAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'EGP' },
    senderName: { type: String, default: '' },
    senderPhone: { type: String, default: '' },
    transferRef: { type: String, default: '' },
    proof: { type: proofSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ['submitted', 'verified', 'rejected'],
      default: 'submitted',
      index: true,
    },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: '' },
    reviewNote: { type: String, default: '' },
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, createdAt: -1 });

applyIdVirtual(paymentSchema);

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
