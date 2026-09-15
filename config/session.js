const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const { SESSION_SECRET, isProduction } = require('./env');

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function ignoreMissingSessionTouch(store) {
  const originalTouch = store.touch.bind(store);
  store.touch = (sid, sess, callback = () => {}) => {
    originalTouch(sid, sess, (error) => {
      if (error && /Unable to find the session to touch/i.test(error.message)) {
        return callback();
      }
      callback(error);
    });
  };
  return store;
}

function createSessionMiddleware() {
  const store = ignoreMissingSessionTouch(MongoStore.create({
    client: mongoose.connection.getClient(),
    collectionName: 'sessions',
    ttl: WEEK_MS / 1000,
    autoRemove: 'native',
    touchAfter: 60,
  }));

  return session({
    name: 'safarny.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store,
    cookie: {
      maxAge: WEEK_MS,
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    },
  });
}

module.exports = { createSessionMiddleware };
