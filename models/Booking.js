const mongoose = require('mongoose');
const { applyIdVirtual } = require('./_options');

const historySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    byUserId: { type: String, default: '' },
    note: { type: String, default: '' },
    label: { type: String, default: '' },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    companyId: { type: String, required: true, index: true },
    tripId: { type: String, required: true, index: true },
    userId: { type: String, default: null, index: true },
    tripName: { type: String, default: '' },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    seats: { type: Number, default: 1 },
    rooms: { type: Number, default: 1 },
    roomType: { type: String, default: '' },
    occupancy: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    basePrice: { type: Number, default: 0 },
    markupAmount: { type: Number, default: 0 },
    settlementStatus: {
      type: String,
      enum: ['unsettled', 'settled'],
      default: 'unsettled',
      index: true,
    },
    settledAt: { type: Date, default: null },
    bookingDate: { type: Date, default: Date.now },
    tripDate: { type: Date, default: null },
    travelDateId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    notes: { type: String, default: '' },
    adminNote: { type: String, default: '' },
    paymentMethod: {
      type: String,
      enum: ['instapay', 'mobile_wallet', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer', 'legacy'],
      default: 'legacy',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'submitted', 'verified', 'rejected'],
      default: 'unpaid',
      index: true,
    },
    paymentId: { type: String, default: '', index: true },
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    location: { type: String, default: '' },
    duration: { type: String, default: '' },
    statusHistory: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, bookingDate: -1 });
bookingSchema.index({ companyId: 1, status: 1 });
bookingSchema.index({ paymentStatus: 1, bookingDate: -1 });
applyIdVirtual(bookingSchema);

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
