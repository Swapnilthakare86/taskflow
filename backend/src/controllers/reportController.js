// Purpose: Handles HTTP requests and maps them to service-layer actions.
'use strict';
const asyncHandler    = require('../utils/asyncHandler');
const { success }     = require('../utils/apiResponse');
const reportService   = require('../services/reportService');

// Get project summary stats (total tasks, completed, etc)
const getSummary = asyncHandler(async (req, res) => {
  const data = await reportService.getSummary(Number(req.params.projectId), req.user);
  success(res, data, 'Summary retrieved');
});

// Get task status distribution counts
const getStatusDist = asyncHandler(async (req, res) => {
  const data = await reportService.getStatusDist(Number(req.params.projectId), req.user);
  success(res, data, 'Status distribution retrieved');
});

// Get tasks completed/added trend over time
const getTrend = asyncHandler(async (req, res) => {
  const data = await reportService.getTrend(Number(req.params.projectId), req.user);
  success(res, data, 'Trend data retrieved');
});

// Get workload distribution by team member
const getWorkload = asyncHandler(async (req, res) => {
  const data = await reportService.getWorkload(Number(req.params.projectId), req.user);
  success(res, data, 'Workload retrieved');
});

module.exports = { getSummary, getStatusDist, getTrend, getWorkload };


