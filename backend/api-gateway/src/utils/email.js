/**
 * email.js  —  backend/api-gateway/src/utils/email.js
 * ─────────────────────────────────────────────────────
 * Transactional email via Nodemailer + Gmail SMTP (App Password).
 * Works out of the box — no domain verification, sends to any address.
 *
 * Setup (one-time, 2 minutes):
 *   1. Go to myaccount.google.com → Security → 2-Step Verification → ON
 *   2. Search "App passwords" → create one → name it "TalentFlow"
 *   3. Copy the 16-char password (no spaces) into .env
 *
 * Env vars:
 *   GMAIL_USER      — your Gmail address  e.g. you@gmail.com
 *   GMAIL_APP_PASS  — 16-char App Password e.g. abcdabcdabcdabcd
 *
 * Free limits: 500 emails/day via Gmail SMTP. More than enough for demo.
 */

const nodemailer = require('nodemailer');

// ─── Lazy transporter (reads env at call time, not module load time) ──────────
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;

  if (!user || !pass) {
    console.warn('[email] GMAIL_USER or GMAIL_APP_PASS not set — emails disabled');
    return null;
  }

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return _transporter;
};

const FROM = () =>
  `TalentFlow AI <${process.env.GMAIL_USER || 'noreply@talentflow.ai'}>`;

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

const baseLayout = (bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>TalentFlow AI</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px;">
            <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px;">⚡ TalentFlow AI</span>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              Sent by TalentFlow AI · Part of an active recruitment workflow.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const pill = (text, color = '#4f46e5', bg = '#ede9fe') =>
  `<span style="display:inline-block;padding:4px 12px;background:${bg};color:${color};border-radius:999px;font-size:13px;font-weight:600;">${text}</span>`;

const infoRow = (label, value) => `
  <tr>
    <td style="color:#64748b;font-size:14px;padding:7px 0;width:140px;vertical-align:top;">${label}</td>
    <td style="color:#1e293b;font-size:14px;font-weight:600;padding:7px 0;">${value}</td>
  </tr>`;

const btn = (text, href) =>
  `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:15px;">${text}</a>`;

// ─── Templates ────────────────────────────────────────────────────────────────

const EmailTemplates = {

  interviewScheduled(interview, candidate) {
    const scheduledDate = new Date(interview.scheduledAt).toLocaleString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
    const typeLabel = (interview.type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const modeLabel = (interview.mode || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const body = `
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">Interview Scheduled ✅</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
        Hi <strong style="color:#1e293b;">${candidate.name}</strong>, your interview has been confirmed.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Type', `${typeLabel} — Round ${interview.round}`)}
          ${infoRow('Date &amp; Time', `${scheduledDate} IST`)}
          ${infoRow('Duration', `${interview.duration} minutes`)}
          ${infoRow('Mode', modeLabel)}
          ${interview.meetingLink ? infoRow('Meeting Link', `<a href="${interview.meetingLink}" style="color:#4f46e5;">${interview.meetingLink}</a>`) : ''}
          ${interview.location   ? infoRow('Location', interview.location) : ''}
        </table>
      </div>
      ${interview.notes ? `<p style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;font-size:14px;color:#78350f;margin-bottom:24px;"><strong>Note:</strong> ${interview.notes}</p>` : ''}
      <p style="color:#64748b;font-size:14px;margin:0;">Please be prepared and on time. Good luck! 🍀</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:8px;">— TalentFlow AI Hiring Team</p>
    `;

    return {
      to: candidate.email,
      subject: `Interview Scheduled — ${typeLabel} (Round ${interview.round})`,
      html: baseLayout(body),
    };
  },

  stageChanged(candidate, jobTitle, prevStage, newStage) {
    const LABELS = {
      applied: 'Applied', screening: 'Screening', interview: 'Interview',
      offer: 'Offer Extended', hired: 'Hired 🎉', rejected: 'Not Moving Forward',
    };
    const accentColor = newStage === 'hired' ? '#10b981' : newStage === 'rejected' ? '#ef4444' : '#4f46e5';
    const accentBg    = newStage === 'hired' ? '#d1fae5' : newStage === 'rejected' ? '#fee2e2' : '#ede9fe';

    const headline =
      newStage === 'hired'    ? `Congratulations — You've been hired! 🎉` :
      newStage === 'offer'    ? `Great news — an offer is on its way!` :
      newStage === 'rejected' ? `Update on your application` :
                                `Your application has moved forward`;

    const body = `
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">${headline}</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
        Hi <strong style="color:#1e293b;">${candidate.name}</strong>, here's an update on your
        application for <strong style="color:#1e293b;">${jobTitle}</strong>.
      </p>
      <div style="display:flex;align-items:center;gap:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;">
        <div style="flex:1;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Previous</p>
          ${pill(LABELS[prevStage] || prevStage, '#64748b', '#f1f5f9')}
        </div>
        <div style="font-size:20px;color:#94a3b8;">→</div>
        <div style="flex:1;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Current</p>
          ${pill(LABELS[newStage] || newStage, accentColor, accentBg)}
        </div>
      </div>
      ${newStage !== 'rejected'
        ? `<p style="color:#64748b;font-size:14px;">Our team will be in touch with next steps soon.</p>`
        : `<p style="color:#64748b;font-size:14px;">After careful consideration, we've decided not to move forward at this time. We encourage you to apply again in the future.</p>`
      }
      <p style="color:#94a3b8;font-size:13px;margin-top:16px;">— TalentFlow AI Hiring Team</p>
    `;

    return {
      to: candidate.email,
      subject: `Application Update: ${LABELS[newStage] || newStage} — ${jobTitle}`,
      html: baseLayout(body),
    };
  },

  premiumActivated(user) {
    const FEATURES = [
      '🤖 AI Resume Parsing with structured profile extraction',
      '📊 Candidate Fit Score (0–100) with detailed explanation',
      '🎯 Skill gap analysis — matched & missing skills',
      '⚡ Smart shortlisting suggestions',
      '🔍 Keyword & domain extraction',
      '👥 Duplicate candidate detection',
      '📈 Full analytics dashboard',
      '📧 Priority email support',
    ];

    const body = `
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">Welcome to Premium! 🎉</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
        Hi <strong style="color:#1e293b;">${user.name}</strong>, your TalentFlow Premium plan is now active.
      </p>
      <div style="background:linear-gradient(135deg,#312e81,#4f46e5);border-radius:12px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 16px;color:#c7d2fe;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">What's now unlocked</p>
        ${FEATURES.map(f => `<p style="margin:0 0 10px;color:#e0e7ff;font-size:14px;line-height:1.5;">${f}</p>`).join('')}
      </div>
      <div style="text-align:center;margin-bottom:8px;">
        ${btn('Go to Dashboard →', `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`)}
      </div>
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin-top:16px;">— TalentFlow AI Team</p>
    `;

    return {
      to: user.email,
      subject: `You're Premium! TalentFlow AI features are now unlocked ✨`,
      html: baseLayout(body),
    };
  },
};

// ─── Sender ───────────────────────────────────────────────────────────────────

/**
 * Send a transactional email. Never throws — logs warning on failure.
 * @param {{ to: string, subject: string, html: string }} template
 */
async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) return;
  if (!to) { console.warn('[email] No recipient — skipping:', subject); return; }

  try {
    const info = await transporter.sendMail({ from: FROM(), to, subject, html });
    console.log(`[email] Sent "${subject}" → ${to} (messageId: ${info.messageId})`);
  } catch (err) {
    console.warn('[email] Send failed (non-critical):', err.message);
  }
}

module.exports = { sendEmail, EmailTemplates };