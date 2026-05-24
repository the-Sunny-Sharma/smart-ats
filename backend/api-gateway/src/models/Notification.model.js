const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'new_application', 'stage_changed', 'interview_scheduled',
      'interview_reminder', 'shortlisted', 'offer_sent', 'candidate_hired',
      'job_posted', 'ai_score_ready',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  link: { type: String },   // frontend route to navigate to
  meta: { type: mongoose.Schema.Types.Mixed }, // extra data
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);