const mongoose = require('mongoose');
const { applyIdVirtual } = require('./_options');

const payoutAccountsSchema = new mongoose.Schema(
  {
    instapayIpa: { type: String, default: '' },
    instapayMobile: { type: String, default: '' },
    vodafoneCash: { type: String, default: '' },
    orangeCash: { type: String, default: '' },
    etisalatCash: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccountName: { type: String, default: '' },
    bankAccountNumber: { type: String, default: '' },
    bankIban: { type: String, default: '' },
    instructionsEn: { type: String, default: 'Transfer the exact total amount and upload your payment screenshot.' },
    instructionsAr: { type: String, default: 'حوّل المبلغ بالكامل ثم ارفع لقطة شاشة للتحويل.' },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'default' },
    commissionRate: { type: Number, default: 12 },
    currency: { type: String, default: 'EGP' },
    defaultLocale: { type: String, default: 'en' },
    autoApproveTrips: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false },
    destinations: { type: [mongoose.Schema.Types.Mixed], default: [] },
    categories: { type: [String], default: [] },
    payoutAccounts: { type: payoutAccountsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

applyIdVirtual(settingsSchema);

module.exports = mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', settingsSchema);
