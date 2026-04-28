// Purpose: Contains business logic and orchestrates repository calls.
'use strict';
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');
const AppError   = require('../utils/AppError');
const { signToken } = require('../utils/jwtHelper');
const { CLIENT_URL, NODE_ENV, BCRYPT_ROUNDS } = require('../config/env');
const userRepo   = require('../repositories/userRepository');
const passwordResetRepo = require('../repositories/passwordResetRepository');
const mailService = require('./mailService');

async function login(email, password) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AppError('Email is not registered. Please register first.', 404);
  if (!user.is_active) throw new AppError('Your account has been disabled. Please contact support.', 403);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Password is incorrect.', 401);

  const token = signToken({ id: user.id, role: user.role });
  const { password_hash: _pw, ...safeUser } = user;
  return { token, user: safeUser };
}

function initialsFromName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function colorFromEmail(email) {
  const palette = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
  const hash = [...email].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

async function register({ name, email, role, password }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new AppError('Email is already registered.', 409);
  if (!['admin', 'manager', 'employee', 'client'].includes(role)) throw new AppError('Invalid role selected.', 400);

  const departmentByRole = {
    admin: 'Administration',
    manager: 'Management',
    employee: 'General',
    client: 'Client',
  };

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await userRepo.create({
    name,
    email,
    passwordHash,
    role,
    department: departmentByRole[role] || 'General',
    avatarColor: colorFromEmail(email),
    initials: initialsFromName(name),
  });

  const token = signToken({ id: user.id, role: user.role });
  return { token, user };
}

// Hash string using SHA-256
function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Add minutes to a date
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// Handle forgot password - generate reset token and send email
async function forgotPassword(email) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AppError('Email is not registered.', 404);
  if (!user.is_active) throw new AppError('Your account is disabled. Please contact support.', 403);

  // Generate random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256(resetToken);
  const expiresAt = addMinutes(new Date(), 15); // Token valid for 15 minutes
  const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;

  // Store hashed token in database
  await passwordResetRepo.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  // Send reset email
  await mailService.sendPasswordReset({
    toEmail: user.email,
    userName: user.name,
    resetUrl,
  });

  const data = { email: user.email };
  // Return reset URL in development for testing
  if (NODE_ENV !== 'production') data.resetUrl = resetUrl;
  return data;
}

async function resetPassword(token, newPassword) {
  const tokenHash = sha256(token);
  const resetRecord = await passwordResetRepo.findValidByTokenHash(tokenHash);
  if (!resetRecord) throw new AppError('Reset link is invalid or expired.', 400);

  const user = await userRepo.findAuthById(resetRecord.user_id);
  if (!user) throw new AppError('User account not found.', 404);
  if (!user.is_active) throw new AppError('Your account is disabled. Please contact support.', 403);

  const sameAsOld = await bcrypt.compare(newPassword, user.password_hash);
  if (sameAsOld) throw new AppError('New password must be different from current password.', 400);

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await userRepo.updatePasswordHash(user.id, passwordHash);
  await passwordResetRepo.markUsed(resetRecord.id);
  await passwordResetRepo.invalidateAllByUserId(user.id);

  return { email: user.email };
}

module.exports = { login, register, forgotPassword, resetPassword };

