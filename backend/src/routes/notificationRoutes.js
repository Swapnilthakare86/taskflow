'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.patch('/:id/read', ctrl.markRead);
router.patch('/mark-all-read', ctrl.markAllRead);

module.exports = router;
