const Job = require('../models/Job.model');
const Application = require('../models/Application.model');
const Candidate = require('../models/Candidate.model');
const Interview = require('../models/Interview.model');
const { subDays, startOfDay, endOfDay, format } = require('date-fns');

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/analytics/overview
 * Top-level KPIs: totals, trends, conversion rates
 */
exports.getOverview = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    // Current 30-day window
    const [
      totalJobs, openJobs,
      totalCandidates,
      totalApplications,
      applicationsThisMonth,
      applicationsPrevMonth,
      shortlisted, hired, interviews,
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Candidate.countDocuments(),
      Application.countDocuments(),
      Application.countDocuments({ appliedAt: { $gte: thirtyDaysAgo } }),
      Application.countDocuments({ appliedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      Application.countDocuments({ isShortlisted: true }),
      Application.countDocuments({ stage: 'hired' }),
      Interview.countDocuments({ scheduledAt: { $gte: thirtyDaysAgo } }),
    ]);

    // Conversion funnel: applied → shortlisted → hired
    const conversionRate = totalApplications > 0
      ? ((hired / totalApplications) * 100).toFixed(1)
      : 0;

    const applicationGrowth = applicationsPrevMonth > 0
      ? (((applicationsThisMonth - applicationsPrevMonth) / applicationsPrevMonth) * 100).toFixed(1)
      : 0;

    res.json({
      kpis: {
        totalJobs,
        openJobs,
        totalCandidates,
        totalApplications,
        shortlisted,
        hired,
        interviews,
        conversionRate: Number(conversionRate),
        applicationGrowth: Number(applicationGrowth),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/pipeline
 * Stage distribution across all open jobs
 */
exports.getPipelineStats = async (req, res) => {
  try {
    const { jobId } = req.query;
    const matchFilter = jobId ? { job: new require('mongoose').Types.ObjectId(jobId) } : {};

    const pipeline = await Application.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Ensure all stages appear in result even if count = 0
    const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
    const stageMap = Object.fromEntries(pipeline.map((p) => [p._id, p.count]));
    const result = stages.map((s) => ({ stage: s, count: stageMap[s] || 0 }));

    res.json({ pipeline: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/applications-over-time
 * Daily application counts for the last N days (default 30)
 */
exports.getApplicationsOverTime = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const from = subDays(new Date(), days);

    const data = await Application.aggregate([
      { $match: { appliedAt: { $gte: from } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/top-jobs
 * Jobs ranked by application count
 */
exports.getTopJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'open' })
      .select('title department totalApplications pipeline')
      .sort({ totalApplications: -1 })
      .limit(10);
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/ai-scores
 * Distribution of AI scores across applications
 */
exports.getAIScoreDistribution = async (req, res) => {
  try {
    const { jobId } = req.query;
    const match = { 'aiScore.overall': { $exists: true, $ne: null } };
    if (jobId) match.job = jobId;

    const distribution = await Application.aggregate([
      { $match: match },
      {
        $bucket: {
          groupBy: '$aiScore.overall',
          boundaries: [0, 20, 40, 60, 80, 101],
          default: 'other',
          output: { count: { $sum: 1 }, avgScore: { $avg: '$aiScore.overall' } },
        },
      },
    ]);

    const recommendations = await Application.aggregate([
      { $match: { 'aiScore.recommendation': { $exists: true } } },
      { $group: { _id: '$aiScore.recommendation', count: { $sum: 1 } } },
    ]);

    res.json({ distribution, recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/source-breakdown
 * Where candidates are coming from
 */
exports.getSourceBreakdown = async (req, res) => {
  try {
    const sources = await Candidate.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};