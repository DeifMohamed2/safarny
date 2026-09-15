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
    bankName: { type: String, default: '' },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    iban: { type: String, default: '' },
    swift: { type: String, default: '' },
    walletProvider: { type: String, default: '' },
    walletNumber: { type: String, default: '' },
    instapayIpa: { type: String, default: '' },
  },
  { _id: false }
);

const adjustmentSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    refundId: { type: String, default: '' },
  },
  { _id: false }
);

const payoutSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    currency: { type: String, default: 'EGP' },
    method: { type: String, default: '' },
    destination: { type: destinationSchema, default: () => ({}) },
    bookingIds: { type: [String], default: [] },
    grossCollected: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    adjustments: { type: [adjustmentSchema], default: [] },
    netPayable: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'processing', 'paid', 'failed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    reference: { type: String, default: '' },
    proof: { type: proofSchema, default: () => ({}) },
    statementNumber: { type: String, default: '' },
    createdBy: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ companyId: 1, status: 1 });
applyIdVirtual(payoutSchema);

module.exports = mongoose.models.Payout || mongoose.model('Payout', payoutSchema);
