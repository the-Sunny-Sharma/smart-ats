const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },

  type: {
    type: String,
    enum: ['phone_screen', 'technical', 'hr', 'final', 'panel'],
    default: 'phone_screen',
  },
  round: { type: Number, default: 1 },

  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // minutes
  timezone: { type: String, default: 'Asia/Kolkata' },

  mode: { type: String, enum: ['video', 'phone', 'in_person'], default: 'video' },
  meetingLink: { type: String },
  location: { type: String },

  interviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'],
    default: 'scheduled',
  },

  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    notes: { type: String },
    recommendation: { type: String, enum: ['hire', 'no_hire', 'maybe', 'next_round'] },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
  },

  // Email tracking
  candidateNotified: { type: Boolean, default: false },
  interviewersNotified: { type: Boolean, default: false },

}, { timestamps: true });

interviewSchema.index({ application: 1 });
interviewSchema.index({ scheduledAt: 1 });
interviewSchema.index({ status: 1 });

module.exports = mongoose.model('Interview', interviewSchema);