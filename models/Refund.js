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

const destinationSchema = new mongoose.Schema(
  {
    method: { type: String, default: '' },
    walletNumber: { type: String, default: '' },
    instapayIpa: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    iban: { type: String, default: '' },
  },
  { _id: false }
);

const refundSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    bookingId: { type: String, required: true, index: true },
    paymentId: { type: String, default: '', index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    requestedAmount: { type: Number, required: true },
    approvedAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'EGP' },
    reasonCategory: {
      type: String,
      enum: ['cancellation', 'date_change', 'trip_issue', 'duplicate', 'other'],
      default: 'other',
    },
    reason: { type: String, default: '' },
    method: { type: String, default: '' },
    destination: { type: destinationSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ['requested', 'approved', 'declined', 'processing', 'refunded', 'cancelled'],
      default: 'requested',
      index: true,
    },
    platformFeeRefunded: { type: Number, default: 0 },
    companyClawback: { type: Number, default: 0 },
    clawbackPayoutId: { type: String, default: '' },
    proof: { type: proofSchema, default: () => ({}) },
    reference: { type: String, default: '' },
    reviewedBy: { type: String, default: '' },
    reviewNote: { type: String, default: '' },
    creditNoteNumber: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

refundSchema.index({ status: 1, createdAt: -1 });
refundSchema.index({ bookingId: 1, status: 1 });
applyIdVirtual(refundSchema);

module.exports = mongoose.models.Refund || mongoose.model('Refund', refundSchema);
