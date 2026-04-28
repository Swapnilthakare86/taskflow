'use strict';
const AppError = require('../utils/AppError');
const projectRepo = require('../repositories/projectRepository');
const reportRepo = require('../repositories/reportRepository');

async function ensureAccess(projectId, user) {
  if (user.role === 'admin') return;
  const isMember = await projectRepo.isMember(projectId, user.id);
  if (!isMember) throw new AppError('Access denied to this project.', 403);
}

async function getSummary(projectId, user) {
  await ensureAccess(projectId, user);
  return reportRepo.getSummary(projectId);
}

async function getStatusDist(projectId, user) {
  await ensureAccess(projectId, user);
  return reportRepo.getStatusDist(projectId);
}

async function getTrend(projectId, user) {
  await ensureAccess(projectId, user);
  return reportRepo.getTrend(projectId);
}

async function getWorkload(projectId, user) {
  await ensureAccess(projectId, user);
  return reportRepo.getWorkload(projectId);
}

module.exports = { getSummary, getStatusDist, getTrend, getWorkload };
