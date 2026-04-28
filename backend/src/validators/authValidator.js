'use strict';
const { body } = require('express-validator');
const { ALLOWED_EMAIL_DOMAINS } = require('../config/env');

const emailDomainRule = () =>
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .bail()
    .custom((value) => {
      const [, domain = ''] = String(value).toLowerCase().split('@');
      if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
        throw new Error(`Email domain is not allowed. Use: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`);
      }
      return true;
    })
    .normalizeEmail();

const loginValidator = [
  emailDomainRule(),
  body('password').isLength({ min: 4 }).withMessage('Password is required'),
];

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  emailDomainRule(),
  body('role').isIn(['admin', 'manager', 'employee', 'client']).withMessage('Role must be one of admin, manager, employee, client'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const forgotPasswordValidator = [
  emailDomainRule(),
];

const resetPasswordValidator = [
  body('token').isString().notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const acceptInviteValidator = [
  body('token').isString().notEmpty().withMessage('Invite token is required'),
];

module.exports = {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  acceptInviteValidator,
};
