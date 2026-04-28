'use strict';
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const userRepo = require('../repositories/userRepository');

function initialsFromName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

async function getAllUsers() {
  return userRepo.findAll();
}

async function getAllEmployees() {
  return userRepo.findAllEmployees();
}

async function getById(id) {
  const user = await userRepo.findById(id);
  if (!user) throw new AppError('User not found.', 404);
  return user;
}

async function updateMe(id, data) {
  const name = String(data.name || '').trim();
  const department = String(data.department || '').trim();

  if (!name) throw new AppError('Full name is required.', 400);
  if (name.length < 2) throw new AppError('Full name must be at least 2 characters.', 400);
  if (name.length > 120) throw new AppError('Full name must not exceed 120 characters.', 400);
  if (department.length > 120) throw new AppError('Department must not exceed 120 characters.', 400);

  const payload = {
    name,
    department,
    initials: initialsFromName(name),
  };
  const updated = await userRepo.update(id, payload);
  if (!updated) throw new AppError('Nothing to update.', 400);
  return updated;
}

async function updateMyPassword(id, currentPassword, newPassword) {
  if (!currentPassword) throw new AppError('Current password is required.', 400);
  if (!newPassword) throw new AppError('New password is required.', 400);
  if (newPassword.length < 6) throw new AppError('New password must be at least 6 characters.', 400);

  const user = await userRepo.findAuthById(id);
  if (!user) throw new AppError('User not found.', 404);
  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) throw new AppError('Current password is incorrect.', 400);
  const sameAsOld = await bcrypt.compare(newPassword, user.password_hash);
  if (sameAsOld) throw new AppError('New password must be different from current password.', 400);
  const hash = await bcrypt.hash(newPassword, 12);
  await userRepo.updatePasswordHash(id, hash);
}

module.exports = { getAllUsers, getAllEmployees, getById, updateMe, updateMyPassword };
