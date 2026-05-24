const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  // Core info
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String },
  location: { type: String },
  linkedIn: { type: String },
  github: { type: String },
  portfolio: { type: String },

  // Resume
  resumeUrl: { type: String },         // stored file path
  resumeText: { type: String },        // extracted raw text for AI

  // AI-parsed profile
  parsedProfile: {
    summary: { type: String },
    skills: [{ type: String }],
    experience: [{
      company: String,
      title: String,
      duration: String,
      description: String,
    }],
    education: [{
      institution: String,
      degree: String,
      field: String,
      year: String,
    }],
    totalExperience: { type: Number, default: 0 },  // years
    keywords: [{ type: String }],
  },

  // Duplicate detection
  fingerprint: { type: String, index: true }, // hash of name+email

  // Meta
  source: { type: String, enum: ['manual', 'upload', 'referral', 'linkedin'], default: 'upload' },
  tags: [{ type: String }],
  notes: { type: String },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

candidateSchema.index({ email: 1 });
candidateSchema.index({ 'parsedProfile.skills': 1 });
candidateSchema.index({ name: 'text', email: 'text', 'parsedProfile.skills': 'text' });

module.exports = mongoose.model('Candidate', candidateSchema);