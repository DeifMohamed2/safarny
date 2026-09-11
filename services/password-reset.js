const crypto = require('crypto');
const { PasswordResetToken } = require('../models');
const { findByEmail, updateUser } = require('./users');
const { hashPassword, comparePassword } = require('../lib/password');
const { NODE_ENV } = require('../config/env');

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function issueResetToken(email) {
  const user = await findByEmail(email);
  if (!user) return { ok: true };
  const otp = generateOtp();
  const tokenHash = await hashPassword(otp);
  await PasswordResetToken.updateMany({ userId: user.id, usedAt: null }, { $set: { usedAt: new Date() } });
  await PasswordResetToken.create({
    userId: user.id,
    email: user.email,
    tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  if (NODE_ENV !== 'production') {
    console.log(`[dev] Password reset OTP for ${user.email}: ${otp}`);
  }
  return { ok: true, userId: user.id };
}

async function verifyResetToken(email, otp) {
  const user = await findByEmail(email);
  if (!user) return null;
  const token = await PasswordResetToken.findOne({
    userId: user.id,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ expiresAt: -1 });
  if (!token) return null;
  const ok = await comparePassword(otp, token.tokenHash);
  if (!ok) return null;
  return { tokenId: String(token._id), userId: user.id, email: user.email };
}

async function consumeResetToken(email, otp, newPassword) {
  const verified = await verifyResetToken(email, otp);
  if (!verified) return { ok: false, error: 'invalid' };
  if (!newPassword || String(newPassword).length < 6) return { ok: false, error: 'weak' };
  await updateUser(verified.userId, { password: newPassword });
  await PasswordResetToken.updateOne({ _id: verified.tokenId }, { $set: { usedAt: new Date() } });
  return { ok: true };
}

module.exports = {
  issueResetToken,
  verifyResetToken,
  consumeResetToken,
};
