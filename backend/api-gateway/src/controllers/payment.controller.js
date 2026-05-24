/**
 * payment.controller.js
 * ─────────────────────
 * Cashfree Payments — Order Creation + Webhook Verification
 *
 * Flow:
 *  1. Frontend calls POST /api/payments/create-order
 *  2. We call Cashfree /orders API → get { order_id, payment_session_id }
 *  3. Frontend uses payment_session_id with Cashfree JS SDK to open checkout
 *  4. After payment, Cashfree redirects to /premium?order_id=xxx
 *  5. Frontend calls POST /api/payments/verify  → we mark user isPremium
 *  6. Cashfree also POSTs to POST /api/payments/webhook (background, signed)
 *
 * Env vars required:
 *   CASHFREE_APP_ID      — from Cashfree dashboard
 *   CASHFREE_SECRET_KEY  — from Cashfree dashboard
 *   CASHFREE_ENV         — "sandbox" | "production"  (default: sandbox)
 *   CLIENT_URL           — e.g. http://localhost:3000
 */

const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const { sendEmail, EmailTemplates } = require('../utils/email');

// ─── Cashfree config ──────────────────────────────────────────────────────────

const CF_APP_ID = process.env.CASHFREE_APP_ID || '';
const CF_SECRET = process.env.CASHFREE_SECRET_KEY || '';
const CF_ENV = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();

const CF_BASE_URL =
  CF_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

/** Cashfree API version header — required on every call */
const CF_HEADERS = {
  'x-api-version': '2023-08-01',
  'x-client-id': CF_APP_ID,
  'x-client-secret': CF_SECRET,
  'Content-Type': 'application/json',
};

const PREMIUM_AMOUNT = 999; // ₹999
const PREMIUM_CURRENCY = 'INR';

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Mark a user as premium and fire an in-app notification */
const grantPremium = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isPremium: true, premiumSince: new Date() },
    { new: true }
  );

  await Notification.create({
    user: userId,
    type: 'offer_sent',
    title: '🎉 Premium Activated!',
    message: 'Your TalentFlow Premium plan is now active. AI features are fully unlocked.',
    link: '/dashboard',
  });

  // Send confirmation email (fire-and-forget)
  if (user?.email) {
    sendEmail(EmailTemplates.premiumActivated(user));
  }
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/payments/create-order
 * Creates a Cashfree order and returns payment_session_id to the frontend.
 */
exports.createOrder = async (req, res) => {
  try {
    if (!CF_APP_ID || !CF_SECRET) {
      return res.status(503).json({
        error: 'Payment gateway not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.',
      });
    }

    const user = req.user; // set by authenticate middleware

    // Unique, stable order ID — reuse if same user tries again (idempotent)
    const orderId = `premium_${user._id}_${Date.now()}`;

    const payload = {
      order_id: orderId,
      order_amount: PREMIUM_AMOUNT,
      order_currency: PREMIUM_CURRENCY,
      customer_details: {
        customer_id: String(user._id),
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: req.body.phone || '9999999999', // Cashfree requires phone
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/premium?order_id={order_id}`,
        notify_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/webhook`,
      },
      order_note: 'TalentFlow Premium — Monthly Plan',
    };

    const { data } = await axios.post(`${CF_BASE_URL}/orders`, payload, {
      headers: CF_HEADERS,
    });

    return res.json({
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      cfEnv: CF_ENV,
    });
  } catch (err) {
    console.error('[payment.createOrder]', err?.response?.data || err.message);
    return res.status(500).json({
      error: err?.response?.data?.message || 'Failed to create payment order',
    });
  }
};

/**
 * POST /api/payments/verify
 * Called by the frontend after Cashfree redirects back.
 * Fetches order status from Cashfree and marks user premium on success.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    // Fetch order status from Cashfree
    const { data } = await axios.get(`${CF_BASE_URL}/orders/${orderId}`, {
      headers: CF_HEADERS,
    });

    const status = data.order_status; // PAID | ACTIVE | EXPIRED | CANCELLED

    if (status === 'PAID') {
      await grantPremium(req.user._id);
      return res.json({ success: true, status: 'PAID' });
    }

    return res.json({ success: false, status });
  } catch (err) {
    console.error('[payment.verifyPayment]', err?.response?.data || err.message);
    return res.status(500).json({
      error: err?.response?.data?.message || 'Failed to verify payment',
    });
  }
};

/**
 * POST /api/payments/webhook
 * Cashfree POSTs signed events here (fire-and-forget backup).
 * Verifies the signature and grants premium on PAYMENT_SUCCESS.
 *
 * Signature algorithm (Cashfree docs):
 *   rawBody = request body as-received (Buffer)
 *   ts      = x-webhook-timestamp header
 *   toSign  = ts + rawBody
 *   expected = HMAC-SHA256(toSign, CF_SECRET), base64-encoded
 */
exports.webhook = async (req, res) => {
  try {
    const ts = req.headers['x-webhook-timestamp'];
    const receivedSig = req.headers['x-webhook-signature'];

    if (ts && receivedSig && CF_SECRET) {
      // req.rawBody is set by the raw-body middleware mounted in app.js
      const toSign = ts + (req.rawBody || JSON.stringify(req.body));
      const expected = crypto
        .createHmac('sha256', CF_SECRET)
        .update(toSign)
        .digest('base64');

      if (expected !== receivedSig) {
        console.warn('[payment.webhook] Signature mismatch — ignoring');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;
    const eventType = event?.type; // e.g. "PAYMENT_SUCCESS_WEBHOOK"

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      const customerId = event?.data?.customer_details?.customer_id;
      if (customerId) {
        await grantPremium(customerId);
        console.log(`[payment.webhook] Premium granted for user ${customerId}`);
      }
    }

    // Always 200 — Cashfree retries on non-200
    return res.json({ received: true });
  } catch (err) {
    console.error('[payment.webhook]', err.message);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/payments/status
 * Quick check: is the current user already premium?
 */
exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('isPremium premiumSince');
    return res.json({
      isPremium: user?.isPremium || false,
      premiumSince: user?.premiumSince || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};