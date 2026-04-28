'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { acceptInviteValidator } = require('../validators/authValidator');
const validate = require('../middleware/validateMiddleware');

router.use(protect);
router.get('/', ctrl.getProjects);
router.post('/', requireRole('admin', 'manager'), ctrl.createProject);
router.get('/:id', ctrl.getProject);
router.put('/:id', requireRole('admin', 'manager'), ctrl.updateProject);
router.get('/:id/members', ctrl.getMembers);
router.post('/:id/members', requireRole('admin', 'manager'), ctrl.addMember);
router.post('/:id/invite', requireRole('admin', 'manager'), ctrl.sendInvite);
router.post('/invite/accept', acceptInviteValidator, validate, ctrl.acceptInvite);

module.exports = router;
