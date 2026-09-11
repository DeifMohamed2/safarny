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
    image: { type: String, default: '/assets/companies/company.png' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    location: { type: String, required: true, trim: true },
    years: { type: Number, default: 1 },
    packages: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
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
  },
  { timestamps: true }
);

applyIdVirtual(companySchema);

module.exports = mongoose.models.Company || mongoose.model('Company', companySchema);
