const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  email: { type: String, required: true, lowercase: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
});

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.PasswordResetToken || mongoose.model('PasswordResetToken', tokenSchema);
