// Purpose: Provides shared utility helpers used across the backend.
'use strict';

// Send successful response with status 200
const success = (res, data, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

// Send successful creation response with status 201
const created = (res, data, message = 'Created') =>
  success(res, data, message, 201);

// Send empty successful response with status 204
const noContent = (res) =>
  res.status(204).send();

// Send error response with optional validation errors
const fail = (res, message, statusCode = 400, errors = null) =>
  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });

module.exports = { success, created, noContent, fail };


