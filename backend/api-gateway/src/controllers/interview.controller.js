const Interview = require('../models/Interview.model');
const Application = require('../models/Application.model');
const Notification = require('../models/Notification.model');
const Candidate = require('../models/Candidate.model');
const { sendEmail, EmailTemplates } = require('../utils/email');

exports.getAll = async (req, res) => {
  try {
    const { status, upcoming, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (upcoming === 'true') {
      filter.scheduledAt = { $gte: new Date() };
      filter.status = 'scheduled';
    }

    const [interviews, total] = await Promise.all([
      Interview.find(filter)
        .populate('candidate', 'name email')
        .populate('job', 'title department')
        .populate('interviewers', 'name email avatar')
        .sort({ scheduledAt: 1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Interview.countDocuments(filter),
    ]);
    res.json({ interviews, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidate', 'name email phone')
      .populate('job', 'title department')
      .populate('interviewers', 'name email avatar')
      .populate('scheduledBy', 'name');
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.json({ interview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const interview = await Interview.create({
      ...req.body,
      scheduledBy: req.user._id,
    });

    // Move application to interview stage if still early
    if (req.body.application) {
      const app = await Application.findById(req.body.application);
      if (app && (app.stage === 'applied' || app.stage === 'screening')) {
        app.stage = 'interview';
        app.stageHistory.push({
          stage: 'interview',
          changedBy: req.user._id,
          note: 'Interview scheduled',
        });
        await app.save();
      }
    }

    // Fetch candidate for email
    const candidate = await Candidate.findById(interview.candidate).select('name email');

    // Fire-and-forget email to candidate
    if (candidate) {
      sendEmail(EmailTemplates.interviewScheduled(interview, candidate));
    }

    // In-app notification for the recruiter
    await Notification.create({
      user: req.user._id,
      type: 'interview_scheduled',
      title: 'Interview scheduled',
      message: `Interview scheduled for ${candidate?.name || 'candidate'}`,
      link: `/interviews`,
    });

    await interview.populate('candidate', 'name email');
    await interview.populate('job', 'title department');
    res.status(201).json({ interview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const interview = await Interview.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    ).populate('candidate', 'name email').populate('job', 'title');
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.json({ interview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { rating, notes, recommendation } = req.body;
    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        feedback: {
          rating, notes, recommendation,
          submittedBy: req.user._id,
          submittedAt: new Date(),
        },
      },
      { new: true }
    ).populate('candidate', 'name email').populate('job', 'title');
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.json({ interview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Interview.findByIdAndDelete(req.params.id);
    res.json({ message: 'Interview deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};