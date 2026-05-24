const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User.model');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // SECURITY: Always create as 'recruiter'. Admins assign roles via settings.
    // Exception: if this is the very first user, make them admin.
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'recruiter';

    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id);

    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email, provider: 'local' }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

exports.updateMe = async (req, res) => {
  try {
    const { name, preferences, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (preferences) updates.preferences = preferences;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { name, email, image, googleId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let user = await User.findOne({ email });
    if (!user) {
      const userCount = await User.countDocuments();
      user = await User.create({
        name, email, provider: 'google', googleId, avatar: image,
        role: userCount === 0 ? 'admin' : 'recruiter',
      });
    } else if (user.provider === 'local') {
      user.googleId = googleId;
      user.provider = 'google';
      await user.save();
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Admin: list all users ───────────────────────────────────────────────────
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Admin: update role ──────────────────────────────────────────────────────
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'recruiter', 'hiring_manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    // Prevent admin from removing their own admin role
    if (req.params.userId === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }
    const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Admin: activate/deactivate ─────────────────────────────────────────────
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    const user = await User.findByIdAndUpdate(req.params.userId, { isActive }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};