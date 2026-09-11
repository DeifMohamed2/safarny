const mongoose = require('mongoose');
const { applyIdVirtual } = require('./_options');

const messageSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ['customer', 'company'], required: true },
    author: { type: String, default: '' },
    text: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    subject: { type: String, default: '' },
    unread: { type: Number, default: 0 },
    lastReply: { type: String, default: '' },
    lastFrom: { type: String, default: '' },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

applyIdVirtual(conversationSchema);

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
