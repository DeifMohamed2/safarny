const bcrypt = require('bcryptjs');

const ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(String(plain), ROUNDS);
}

async function comparePassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(String(plain), String(hash));
}

module.exports = { hashPassword, comparePassword, ROUNDS };
