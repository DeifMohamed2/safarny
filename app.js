require('./config/env');

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const { PORT } = require('./config/env');
const { connectDb, disconnectDb, dbState } = require('./config/db');
const { createSessionMiddleware } = require('./config/session');
const { attachLocals } = require('./middleware/auth');
const pageRoutes = require('./routes/pages');
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/company');
const adminRoutes = require('./routes/admin');

async function start() {
  await connectDb();

  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: '8mb' }));
  app.use(cookieParser());
  app.use(createSessionMiddleware());
  app.use(attachLocals);

  app.get('/health', (req, res) => {
    res.json({ ok: dbState() === 'connected', db: dbState() });
  });

  app.use('/assets', express.static(path.join(__dirname, 'attached_assets')));
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/auth', authRoutes);
  app.use('/company', companyRoutes);
  app.use('/admin', adminRoutes);
  app.use('/', pageRoutes);

  app.use((req, res) => {
    res.status(404).render('pages/not-found', { title: 'Page not found' });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render('pages/not-found', {
      title: 'Something went wrong',
      heading: 'Something went wrong',
      message: 'Please try again in a moment.',
    });
  });

  const server = app.listen(PORT, () => {
    console.log(`Safarny running at http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    await new Promise((resolve) => server.close(resolve));
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Failed to start Safarny:', error);
  process.exit(1);
});
