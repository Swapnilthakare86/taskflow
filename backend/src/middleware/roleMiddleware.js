// Purpose: Applies cross-cutting request concerns like auth/validation/errors.
'use strict';
const AppError = require('../utils/AppError');

// Middleware factory to check if user has required role(s)
const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError(`Access denied. Required role: ${roles.join(' or ')}.`, 403);
  }
  next();
};

// Shortcut for manager and admin access control
const managerOnly = requireRole('manager', 'admin');

module.exports = { requireRole, managerOnly };


