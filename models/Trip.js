const mongoose = require('mongoose');
const { applyIdVirtual } = require('./_options');

const itinerarySchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['stay', 'activity'], default: 'activity' },
    day: { type: Number, default: 1 },
    dayFrom: { type: Number, default: 1 },
    dayTo: { type: Number, default: 1 },
    location: { type: String, default: '' },
    title: { type: String, default: '' },
    titleAr: { type: String, default: '' },
    description: { type: String, default: '' },
    descriptionAr: { type: String, default: '' },
  },
  { _id: false }
);

const roomTypeSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['single', 'double', 'triple', 'quad'], required: true },
    occupancy: { type: Number, default: 2 },
    price: { type: Number, default: 0 },
    totalRooms: { type: Number, default: 0 },
    availableRooms: { type: Number, default: 0 },
  },
  { _id: false }
);

const travelDateSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, default: '' },
    days: { type: Number, default: 1 },
    nights: { type: Number, default: 0 },
    totalSpots: { type: Number, default: 0 },
    availableSpots: { type: Number, default: 0 },
    rooms: { type: [roomTypeSchema], default: [] },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    titleAr: { type: String, default: '' },
    location: { type: String, default: '' },
    destination: { type: String, required: true, trim: true, index: true },
    category: { type: String, default: 'Leisure' },
    type: { type: String, enum: ['leisure', 'umrah'], default: 'leisure', index: true },
    description: { type: String, default: '' },
    descriptionAr: { type: String, default: '' },
    about: { type: String, default: '' },
    price: { type: Number, default: 0 },
    oldPrice: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    totalSeats: { type: Number, default: 0 },
    availableSeats: { type: Number, default: 0 },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    days: { type: Number, default: 1 },
    nights: { type: Number, default: 0 },
    beds: { type: Number, default: 2 },
    priceMode: { type: String, enum: ['shared', 'per-date'], default: 'shared' },
    roomTypes: { type: [roomTypeSchema], default: [] },
    schedule: { type: String, default: 'daily' },
    frequency: { type: String, default: 'Daily' },
    includedServices: { type: String, default: '' },
    includedList: { type: [String], default: [] },
    itinerary: { type: [itinerarySchema], default: [] },
    travelDates: { type: [travelDateSchema], default: [] },
    cancellationPolicy: { type: String, default: '' },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'sold-out', 'rejected'],
      default: 'draft',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    offer: { type: Boolean, default: false },
    featured: { type: Boolean, default: false, index: true },
    catalog: { type: Boolean, default: false },
    markupType: { type: String, enum: ['percent', 'fixed', 'inherit'], default: 'inherit' },
    markupPercent: { type: Number, default: 0 },
    markupFixed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tripSchema.index({ companyId: 1, status: 1 });
tripSchema.index({ title: 'text', destination: 'text' });
applyIdVirtual(tripSchema);

module.exports = mongoose.models.Trip || mongoose.model('Trip', tripSchema);
