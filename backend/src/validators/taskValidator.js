// Purpose: Defines request validation rules for API endpoints.
'use strict';
const { body, param } = require('express-validator');

// Define valid values for task status and priority fields
const VALID_STATUS   = ['Backlog','To Do','In Progress','In Review','Blocked','Done'];
const VALID_PRIORITY = ['Low','Medium','High','Critical'];

// Validation rules for creating a new task
const createTaskValidator = [
  param('id').isInt({ min: 1 }).withMessage('Project ID must be a positive integer'),
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('description')
    .optional()
    .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),
  body('assigneeId')
    .notEmpty().withMessage('Assignee is required')
    .isInt({ min: 1 }).withMessage('Assignee ID must be a positive integer'),
  body('status')
    .optional()
    .isIn(VALID_STATUS).withMessage(`Status must be one of: ${VALID_STATUS.join(', ')}`),
  body('priority')
    .optional()
    .isIn(VALID_PRIORITY).withMessage(`Priority must be one of: ${VALID_PRIORITY.join(', ')}`),
  body('dueDate')
    .optional({ checkFalsy: true })
    .isLength({ max: 30 }).withMessage('Due date must not exceed 30 characters'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 60 }).withMessage('Each tag must be 1-60 characters'),
];

const updateTaskValidator = [
  param('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('description')
    .optional()
    .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),
  body('assigneeId')
    .optional()
    .isInt({ min: 1 }).withMessage('Assignee ID must be a positive integer'),
  body('status')
    .optional()
    .isIn(VALID_STATUS).withMessage(`Status must be one of: ${VALID_STATUS.join(', ')}`),
  body('priority')
    .optional()
    .isIn(VALID_PRIORITY).withMessage(`Priority must be one of: ${VALID_PRIORITY.join(', ')}`),
  body('dueDate')
    .optional({ checkFalsy: true })
    .isLength({ max: 30 }).withMessage('Due date must not exceed 30 characters'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
];

const updateStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(VALID_STATUS).withMessage(`Status must be one of: ${VALID_STATUS.join(', ')}`),
];

module.exports = { createTaskValidator, updateTaskValidator, updateStatusValidator };


