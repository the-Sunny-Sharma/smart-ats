const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  department: { type: String, required: true },
  location: { type: String, required: true },
  locationType: { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'hybrid' },
  type: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'], default: 'full-time' },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  responsibilities: [{ type: String }],
  skills: [{ type: String }],         // used for AI matching
  experienceMin: { type: Number, default: 0 },
  experienceMax: { type: Number, default: 10 },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['draft', 'open', 'paused', 'closed'], default: 'open' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hiringManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deadline: { type: Date },
  totalApplications: { type: Number, default: 0 },
  pipeline: {
    applied: { type: Number, default: 0 },
    screening: { type: Number, default: 0 },
    interview: { type: Number, default: 0 },
    offer: { type: Number, default: 0 },
    hired: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
  },
}, { timestamps: true });

jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ status: 1 });
jobSchema.index({ postedBy: 1 });

module.exports = mongoose.model('Job', jobSchema);