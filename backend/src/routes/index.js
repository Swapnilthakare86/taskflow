// Main API router - aggregates all route modules
'use strict';
const router = require('express').Router();

// Import route modules
const authRoutes         = require('./authRoutes');
const projectRoutes      = require('./projectRoutes');
const taskRoutes         = require('./taskRoutes');
const notificationRoutes = require('./notificationRoutes');
const reportRoutes       = require('./reportRoutes');
const userRoutes         = require('./userRoutes');

// Import middleware and controllers
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const taskCtrl    = require('../controllers/taskController');
const {
  updateTaskValidator,
  updateStatusValidator,
} = require('../validators/taskValidator');
const validate = require('../middleware/validateMiddleware');

// Public routes (auth)
router.use('/auth',          authRoutes);

// Protected user routes
router.use('/users',         userRoutes);

// Protected project routes
router.use('/projects',      projectRoutes);

// Project-scoped tasks (nested under /projects/:id/tasks)
router.use(
  '/projects/:id/tasks',
  protect,
  taskRoutes
);

// Standalone task routes with role-based access control
router.patch('/tasks/:id/status', protect, requireRole('manager', 'admin', 'employee', 'client'), updateStatusValidator, validate, taskCtrl.updateStatus);
router.put('/tasks/:id',          protect, requireRole('manager', 'admin'), updateTaskValidator,   validate, taskCtrl.updateTask);
router.get('/tasks/:id',          protect, taskCtrl.getTask);
router.delete('/tasks/:id',       protect, requireRole('manager', 'admin'), taskCtrl.deleteTask);

// Protected notification and report routes
router.use('/notifications', notificationRoutes);
router.use('/reports',       reportRoutes);

module.exports = router;


