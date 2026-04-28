'use strict';
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwtHelper');
const userRepo = require('../repositories/userRepository');

async function protect(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Authorization token missing.', 401));
  }

  try {
    const decoded = verifyToken(token);
    const user = await userRepo.findById(decoded.id);
    if (!user || !user.is_active) {
      return next(new AppError('User not found or inactive.', 401));
    }
    req.user = user;
    return next();
  } catch (_err) {
    return next(new AppError('Invalid or expired token.', 401));
  }
}

module.exports = { protect };
