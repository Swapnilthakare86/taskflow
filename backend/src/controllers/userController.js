// Purpose: Handles HTTP requests and maps them to service-layer actions.
'use strict';
const asyncHandler  = require('../utils/asyncHandler');
const { success }   = require('../utils/apiResponse');
const userService   = require('../services/userService');

// Get all users in the system
const getAllUsers = asyncHandler(async (req, res) => {
  const data = await userService.getAllUsers();
  success(res, data, 'Users retrieved');
});

// Get all active employees (for assigning tasks)
const getAllEmployees = asyncHandler(async (req, res) => {
  const data = await userService.getAllEmployees();
  success(res, data, 'Employees retrieved');
});

// Get user by ID
const getUser = asyncHandler(async (req, res) => {
  const data = await userService.getById(Number(req.params.id));
  success(res, data, 'User retrieved');
});

// Update current user profile (name, avatar, etc)
const updateMe = asyncHandler(async (req, res) => {
  const data = await userService.updateMe(req.user.id, req.body);
  success(res, data, 'Profile updated');
});

// Update current user password
const updateMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await userService.updateMyPassword(req.user.id, currentPassword, newPassword);
  success(res, null, 'Password updated');
});

module.exports = { getAllUsers, getAllEmployees, getUser, updateMe, updateMyPassword };


