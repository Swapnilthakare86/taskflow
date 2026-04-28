'use strict';
const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/taskController');
const { requireRole } = require('../middleware/roleMiddleware');
const { createTaskValidator } = require('../validators/taskValidator');
const validate = require('../middleware/validateMiddleware');

router.get('/', ctrl.getTasks);
router.post('/', requireRole('admin', 'manager'), createTaskValidator, validate, ctrl.createTask);

module.exports = router;
