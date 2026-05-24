const Application = require('../models/Application.model');
const Job = require('../models/Job.model');
const Notification = require('../models/Notification.model');
const Candidate = require('../models/Candidate.model');
const axios = require('axios');
const { sendEmail, EmailTemplates } = require('../utils/email');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const updateJobPipelineCount = async (jobId, fromStage, toStage) => {
  const inc = {};
  if (fromStage) inc[`pipeline.${fromStage}`] = -1;
  if (toStage)   inc[`pipeline.${toStage}`]   =  1;
  if (Object.keys(inc).length) {
    await Job.findByIdAndUpdate(jobId, { $inc: inc });
  }
};

const requestAIScore = async (candidateId, jobId) => {
  try {
    const candidate = await Candidate.findById(candidateId).lean();
    const job       = await Job.findById(jobId).lean();

    if (!candidate || !job) {
      console.warn('[AI scoring] Candidate or job not found');
      return null;
    }

    const payload = {
      candidateProfile: candidate.parsedProfile || {
        summary: '', skills: [], experience: [], education: [],
        totalExperience: 0, keywords: [],
      },
      jobDescription:   job.description   || '',
      jobSkills:        job.skills        || [],
      jobRequirements:  job.requirements  || [],
      experienceMin:    job.experienceMin || 0,
      experienceMax:    job.experienceMax || 10,
    };

    const { data } = await axios.post(
      `${process.env.AI_SERVICE_URL}/score-candidate`,
      payload,
      { timeout: 30_000 }
    );
    return data.score || null;
  } catch (err) {
    console.warn('[application.controller] AI scoring unavailable:', err.message);
    return null;
  }
};

// ─── Controllers ─────────────────────────────────────────────────────────────

exports.getAll = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, jobId, stage,
      isShortlisted, sortBy = 'appliedAt', order = 'desc',
      minScore,
    } = req.query;

    const filter = {};
    if (jobId)        filter.job         = jobId;
    if (stage)        filter.stage       = stage;
    if (isShortlisted !== undefined) filter.isShortlisted = isShortlisted === 'true';
    if (minScore)     filter['aiScore.overall'] = { $gte: Number(minScore) };

    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('job', 'title department location')
        .populate('candidate', 'name email phone resumeUrl parsedProfile')
        .populate('submittedBy', 'name')
        .populate('reviewedBy', 'name')
        .sort(sort).skip(skip).limit(Number(limit)),
      Application.countDocuments(filter),
    ]);

    res.json({ applications, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('job')
      .populate('candidate')
      .populate('stageHistory.changedBy', 'name avatar')
      .populate('reviewedBy', 'name avatar');

    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json({ application: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { job, candidate, coverLetter } = req.body;

    const existing = await Application.findOne({ job, candidate });
    if (existing) {
      return res.status(409).json({ error: 'Candidate already applied to this job' });
    }

    const application = await Application.create({
      job, candidate, coverLetter,
      submittedBy: req.user._id,
      stageHistory: [{ stage: 'applied', changedBy: req.user._id, note: 'Application submitted' }],
    });

    await Job.findByIdAndUpdate(job, {
      $inc: { totalApplications: 1, 'pipeline.applied': 1 },
    });

    // Fire-and-forget AI scoring
    requestAIScore(candidate, job).then(async (score) => {
      if (score) {
        await Application.findByIdAndUpdate(application._id, {
          aiScore: { ...score, scoredAt: new Date() },
        });
      }
    });

    const populated = await Application.findById(application._id)
      .populate('job', 'title department')
      .populate('candidate', 'name email');

    res.status(201).json({ application: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStage = async (req, res) => {
  try {
    const { stage, note } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const prevStage = app.stage;

    app.stage = stage;
    app.stageHistory.push({ stage, changedBy: req.user._id, note });
    await app.save();

    await updateJobPipelineCount(app.job, prevStage, stage);

    // In-app notification for the recruiter
    await Notification.create({
      user: req.user._id,
      type: 'stage_changed',
      title: 'Application stage updated',
      message: `Application moved from ${prevStage} → ${stage}`,
      link: `/applications/${app._id}`,
      meta: { applicationId: app._id, jobId: app.job },
    });

    // Email the candidate about their stage change (fire-and-forget)
    const populated = await Application.findById(app._id)
      .populate('job', 'title department')
      .populate('candidate', 'name email');

    const candidate = populated.candidate;
    const job       = populated.job;

    if (candidate?.email) {
      sendEmail(
        EmailTemplates.stageChanged(candidate, job?.title || 'the position', prevStage, stage)
      );
    }

    res.json({ application: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleShortlist = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    app.isShortlisted = !app.isShortlisted;
    await app.save();

    res.json({ application: app, isShortlisted: app.isShortlisted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.triggerAIScore = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('candidate', 'parsedProfile resumeText')
      .populate('job', 'skills requirements');

    if (!app) return res.status(404).json({ error: 'Application not found' });

    const score = await requestAIScore(app.candidate._id, app.job._id);
    if (!score) {
      return res.status(503).json({ error: 'AI service unavailable, please try later' });
    }

    app.aiScore = { ...score, scoredAt: new Date() };
    await app.save();

    res.json({ application: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { reviewNotes, rejectionReason } = req.body;
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { reviewNotes, rejectionReason, reviewedBy: req.user._id },
      { new: true }
    ).populate('candidate', 'name email');

    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json({ application: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/applications/rank/:jobId
 *
 * Semantic ranking of all candidates who have applied to a job.
 * Calls the AI service /semantic-match endpoint which uses
 * sentence-transformers (all-MiniLM-L6-v2) cosine similarity —
 * no external API key required.
 *
 * Response shape:
 *   {
 *     jobId,
 *     jobTitle,
 *     ranked: [
 *       {
 *         applicationId,
 *         candidateId,
 *         candidateName,
 *         candidateEmail,
 *         stage,
 *         isShortlisted,
 *         aiScore,           // existing LLM score if present, else null
 *         semanticScore,     // 0-100 from embeddings
 *         similarityRaw,     // raw cosine value
 *         tier,              // "excellent" | "good" | "fair" | "low"
 *         matchedConcepts,   // skills that semantically overlap with JD
 *         summary,           // 1-line explanation
 *       },
 *       ...
 *     ]
 *   }
 */
exports.rankCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;

    // ── 1. Load the job ───────────────────────────────────────────────────
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // ── 2. Load all applications for this job with candidate profiles ─────
    const applications = await Application.find({ job: jobId })
      .populate('candidate', 'name email parsedProfile resumeText')
      .lean();

    if (applications.length === 0) {
      return res.json({
        jobId,
        jobTitle: job.title,
        ranked: [],
        message: 'No applicants yet',
      });
    }

    // ── 3. Build the payload for the AI service ───────────────────────────
    const candidatePayload = applications.map((app) => ({
      candidateId:   app.candidate._id.toString(),
      parsedProfile: app.candidate.parsedProfile || {},
      resumeText:    app.candidate.resumeText    || '',
    }));

    const jobPayload = {
      _id:          job._id.toString(),
      title:        job.title,
      department:   job.department,
      description:  job.description,
      skills:       job.skills       || [],
      requirements: job.requirements || [],
    };

    // ── 4. Call AI service ────────────────────────────────────────────────
    let semanticResults = [];
    try {
      const { data } = await axios.post(
        `${process.env.AI_SERVICE_URL}/semantic-match`,
        { job: jobPayload, candidates: candidatePayload },
        { timeout: 60_000 },   // model may need to warm up on first call
      );
      semanticResults = data.ranked || [];
    } catch (aiErr) {
      console.warn('[rankCandidates] AI service error:', aiErr.message);
      return res.status(503).json({
        error: 'AI service unavailable. Please try again in a moment.',
        detail: aiErr.message,
      });
    }

    // ── 5. Merge semantic scores back onto application records ────────────
    //      Build a quick lookup: candidateId → semantic result
    const semMap = {};
    for (const r of semanticResults) {
      semMap[r.candidateId] = r;
    }

    const ranked = applications.map((app) => {
      const sem = semMap[app.candidate._id.toString()] || {};
      return {
        applicationId:   app._id.toString(),
        candidateId:     app.candidate._id.toString(),
        candidateName:   app.candidate.name,
        candidateEmail:  app.candidate.email,
        stage:           app.stage,
        isShortlisted:   app.isShortlisted,
        aiScore:         app.aiScore || null,
        semanticScore:   sem.semanticScore   ?? null,
        similarityRaw:   sem.similarityRaw   ?? null,
        tier:            sem.tier            ?? 'unknown',
        matchedConcepts: sem.matchedConcepts ?? [],
        summary:         sem.summary         ?? '',
      };
    });

    // Sort by semanticScore descending (nulls last)
    ranked.sort((a, b) => (b.semanticScore ?? -1) - (a.semanticScore ?? -1));

    return res.json({ jobId, jobTitle: job.title, ranked });
  } catch (err) {
    console.error('[rankCandidates]', err);
    res.status(500).json({ error: err.message });
  }
};