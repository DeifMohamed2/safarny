const mongoose = require('mongoose');
const { applyIdVirtual } = require('./_options');

const verificationFileSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    name: { type: String, default: '' },
    mime: { type: String, default: '' },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    image: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    location: { type: String, required: true, trim: true },
    years: { type: Number, default: 0 },
    packages: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    contactNumber: { type: String, default: '', trim: true },
    verification: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending', index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    joinedAt: { type: Date, default: Date.now },
    commissionRate: { type: Number, default: 12 },
    markupType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    markupFixed: { type: Number, default: 0 },
    verificationDocs: {
      commercialRegister: { type: verificationFileSchema, default: undefined },
      taxCard: { type: verificationFileSchema, default: undefined },
    },
    payoutDetails: {
      method: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      iban: { type: String, default: '' },
      swift: { type: String, default: '' },
      walletProvider: { type: String, default: '' },
      walletNumber: { type: String, default: '' },
      instapayIpa: { type: String, default: '' },
      verifiedAt: { type: Date, default: null },
      verifiedBy: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

applyIdVirtual(companySchema);

module.exports = mongoose.models.Company || mongoose.model('Company', companySchema);
