'use strict';
const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const authService = require('../services/authService');

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body.email, req.body.password);
  success(res, data, 'Login successful');
});

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  created(res, data, 'Registration successful');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body.email);
  success(res, data, 'Reset link sent to your email');
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body.token, req.body.password);
  success(res, data, 'Password reset successful');
});

module.exports = { login, register, forgotPassword, resetPassword };
