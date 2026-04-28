'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/:projectId/summary', ctrl.getSummary);
router.get('/:projectId/status-distribution', ctrl.getStatusDist);
router.get('/:projectId/trend', ctrl.getTrend);
router.get('/:projectId/workload', ctrl.getWorkload);

module.exports = router;
