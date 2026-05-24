/**
 * payment.routes.js
 * POST /api/payments/create-order  — create a Cashfree order
 * POST /api/payments/verify        — verify order after redirect
 * POST /api/payments/webhook       — Cashfree signed webhook
 * GET  /api/payments/status        — check if current user is premium
 */

const router = require('express').Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Webhook does NOT need JWT auth (it's called by Cashfree servers)
router.post('/webhook', paymentController.webhook);

// All other routes require a logged-in user
router.use(authenticate);

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.get('/status', paymentController.getStatus);

module.exports = router;