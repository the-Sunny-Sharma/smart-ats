const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },

  // Pipeline stage
  stage: {
    type: String,
    enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
    default: 'applied',
  },
  stageHistory: [{
    stage: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: String,
  }],

  // AI Scoring
  aiScore: {
    overall: { type: Number, min: 0, max: 100 },    // 0-100
    skillMatch: { type: Number, min: 0, max: 100 },
    experienceMatch: { type: Number, min: 0, max: 100 },
    educationMatch: { type: Number, min: 0, max: 100 },
    explanation: { type: String },                   // explainable AI text
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    recommendation: { type: String, enum: ['strong_yes', 'yes', 'maybe', 'no'] },
    scoredAt: { type: Date },
  },

  // Flags
  isShortlisted: { type: Boolean, default: false },
  isDuplicate: { type: Boolean, default: false },

  // Review
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String },

  // Rejection
  rejectionReason: { type: String },

  // Submission
  coverLetter: { type: String },
  appliedAt: { type: Date, default: Date.now },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ stage: 1 });
applicationSchema.index({ 'aiScore.overall': -1 });
applicationSchema.index({ isShortlisted: 1 });

module.exports = mongoose.model('Application', applicationSchema);