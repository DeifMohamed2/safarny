const mongoose = require('mongoose');
const { applyIdVirtual } = require('./_options');

const ledgerSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    type: {
      type: String,
      enum: ['collection', 'platform_fee', 'payout', 'refund', 'clawback', 'adjustment'],
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['in', 'out'],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'EGP' },
    companyId: { type: String, default: '', index: true },
    bookingId: { type: String, default: '', index: true },
    refId: { type: String, default: '', index: true },
    note: { type: String, default: '' },
    createdBy: { type: String, default: '' },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

ledgerSchema.index({ type: 1, occurredAt: -1 });
ledgerSchema.index({ refId: 1, type: 1 });
applyIdVirtual(ledgerSchema);

module.exports = mongoose.models.LedgerEntry || mongoose.model('LedgerEntry', ledgerSchema);
