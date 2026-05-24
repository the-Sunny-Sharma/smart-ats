const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const jobRoutes = require('./routes/job.routes');
const candidateRoutes = require('./routes/candidate.routes');
const applicationRoutes = require('./routes/application.routes');
const interviewRoutes = require('./routes/interview.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

// ─── Security ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// ─── Rate Limiting ──────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Raw body capture for Cashfree webhook signature ────
// Must come BEFORE express.json() so the raw buffer is still intact.
// Only applied to the webhook route to avoid overhead elsewhere.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, _res, next) => {
  // Store raw buffer as string for HMAC verification in the controller
  req.rawBody = req.body.toString('utf8');
  // Re-parse into an object so the controller can read req.body normally
  try { req.body = JSON.parse(req.rawBody); } catch (_) { req.body = {}; }
  next();
});

// ─── Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Static uploads ─────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health check ───────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'smart-ats-api', timestamp: new Date().toISOString() });
});

// ─── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// ─── 404 ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;