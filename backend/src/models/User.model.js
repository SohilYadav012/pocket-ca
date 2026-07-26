/**
 * models/User.model.js — User Schema
 * Pocket C.A. Backend
 *
 * Referenced by Transaction.model for ownership (userId foreign key).
 * Full auth logic implemented separately in auth routes/controllers.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never return in queries by default
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      maxlength: 3,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// ─── Pre-save: Hash password if modified ─────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// ─── Instance method: Compare password ───────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ─── Remove sensitive fields from JSON output ─────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
