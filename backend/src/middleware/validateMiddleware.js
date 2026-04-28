// Purpose: Applies cross-cutting request concerns like auth/validation/errors.
'use strict';
const { validationResult } = require('express-validator');
const { fail }             = require('../utils/apiResponse');

// Middleware to check for validation errors and return them in a consistent format
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors as array of {field, message} objects
    const messages = errors.array().map(e => ({ field: e.path, message: e.msg }));
    return fail(res, 'Validation failed', 422, messages);
  }
  next();
};

module.exports = validate;


