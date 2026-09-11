const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const { SESSION_SECRET, isProduction } = require('./env');

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function createSessionMiddleware() {
  return session({
    name: 'safarny.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: 'sessions',
      ttl: WEEK_MS / 1000,
      autoRemove: 'native',
    }),
    cookie: {
      maxAge: WEEK_MS,
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    },
  });
}

module.exports = { createSessionMiddleware };
