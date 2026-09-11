const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const PORT = Number(process.env.PORT) || 5170;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/safarny';
const SESSION_SECRET = process.env.SESSION_SECRET || 'safarny-dev-secret';

if (isProduction) {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production.');
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'safarny-dev-secret' || process.env.SESSION_SECRET === 'change-me') {
    throw new Error('SESSION_SECRET must be set to a strong value in production.');
  }
}

module.exports = {
  NODE_ENV,
  isProduction,
  PORT,
  MONGODB_URI,
  SESSION_SECRET,
};
