const { validationResult } = require('express-validator');
const Job = require('../models/Job.model');

exports.getAll = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, search, status, department,
      locationType, type, sortBy = 'createdAt', order = 'desc',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (locationType) filter.locationType = locationType;
    if (type) filter.type = type;
    if (search) filter.$text = { $search: search };

    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('postedBy', 'name email avatar')
        .populate('hiringManager', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(filter),
    ]);

    res.json({ jobs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email avatar')
      .populate('hiringManager', 'name email');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    await job.populate('postedBy', 'name email avatar');
    res.status(201).json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('postedBy', 'name email avatar');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalApplications: { $sum: '$totalApplications' },
        },
      },
    ]);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};