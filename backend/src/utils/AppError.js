// Purpose: Provides shared utility helpers used across the backend.
'use strict';

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode  = statusCode; // HTTP status code
    // Distinguish between client (4xx) and server (5xx) errors
    this.status      = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.code        = code; // Optional database error code
    this.isOperational = true; // Mark as a known error
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;


