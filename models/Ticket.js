const mongoose = require('mongoose');
const { applyIdVirtual } = require('./_options');

const attachmentSchema = new mongoose.Schema(
  {
    url: String,
    name: String,
    size: Number,
    mime: String,
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ['user', 'company', 'admin', 'customer'], required: true },
    author: { type: String, default: '' },
    text: { type: String, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    ticketNo: { type: String, required: true, unique: true },
    source: { type: String, enum: ['traveler', 'company'], required: true, index: true },
    userId: { type: String, default: null, index: true },
    companyId: { type: String, default: null, index: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    status: { type: String, enum: ['open', 'pending', 'resolved', 'closed'], default: 'open', index: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    unread: { type: Number, default: 0 },
    lastReply: { type: String, default: '' },
    lastFrom: { type: String, default: '' },
    assignee: { type: String, default: '' },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

ticketSchema.index({ source: 1, status: 1 });
ticketSchema.virtual('globalId').get(function globalId() {
  return this._id;
});
applyIdVirtual(ticketSchema);

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
