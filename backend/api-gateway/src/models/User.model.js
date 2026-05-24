const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false }, // null for OAuth users
  role: {
    type: String,
    enum: ['admin', 'recruiter', 'hiring_manager'],
    default: 'recruiter',
  },
  avatar: { type: String },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleId: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  isPremium:    { type: Boolean, default: false },
  premiumSince: { type: Date },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);