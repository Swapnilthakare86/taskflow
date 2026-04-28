'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', ctrl.getAllUsers);
router.get('/employees', ctrl.getAllEmployees);
router.get('/:id', ctrl.getUser);
router.patch('/me', ctrl.updateMe);
router.patch('/me/password', ctrl.updateMyPassword);

module.exports = router;
