// Purpose: Applies cross-cutting request concerns like auth/validation/errors.
'use strict';
const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
// Global error handler middleware - catches all errors and returns consistent format
const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message    = err.message;
  error.statusCode = err.statusCode || 500;

  // Handle MySQL errors gracefully
  if (err.code === 'ER_DUP_ENTRY') {
    const field = err.message.match(/for key '(.+?)'/)?.[1] || 'field';
    error = new AppError(`Duplicate value for ${field}. Please use a different value.`, 409);
  }

  // MySQL foreign key constraint
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error = new AppError('Referenced record does not exist.', 400);
  }

  // MySQL enum/field truncation (e.g., invalid role for current schema)
  if (err.code === 'WARN_DATA_TRUNCATED' || err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
    if ((err.message || '').toLowerCase().includes('role')) {
      error = new AppError('Selected role is not supported by current database schema. Please update users.role enum.', 400);
    } else {
      error = new AppError('Invalid value provided for one of the fields.', 400);
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your session has expired. Please log in again.', 401);
  }

  // Development: include stack trace
  const isDev = process.env.NODE_ENV === 'development';

  res.status(error.statusCode).json({
    success:  false,
    message:  error.message || 'Internal server error',
    status:   error.status  || 'error',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;


