// Purpose: Handles HTTP requests and maps them to service-layer actions.
'use strict';
const asyncHandler  = require('../utils/asyncHandler');
const { success, created, noContent } = require('../utils/apiResponse');
const taskService   = require('../services/taskService');

// Get all tasks in a project (with permission checks)
const getTasks = asyncHandler(async (req, res) => {
  const data = await taskService.getTasksByProject(Number(req.params.id), req.user);
  success(res, data, 'Tasks retrieved');
});

// Get single task by ID
const getTask = asyncHandler(async (req, res) => {
  const data = await taskService.getTaskById(Number(req.params.id));
  success(res, data, 'Task retrieved');
});

// Create new task in a project
const createTask = asyncHandler(async (req, res) => {
  const data = await taskService.createTask(Number(req.params.id), req.body, req.user);
  created(res, data, 'Task created');
});

// Update existing task
const updateTask = asyncHandler(async (req, res) => {
  const data = await taskService.updateTask(Number(req.params.id), req.body, req.user);
  success(res, data, 'Task updated');
});

// Update task status only (e.g., To Do -> In Progress -> Done)
const updateStatus = asyncHandler(async (req, res) => {
  const data = await taskService.updateTaskStatus(Number(req.params.id), req.body.status, req.user);
  success(res, data, 'Status updated');
});

// Delete task
const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(Number(req.params.id));
  noContent(res);
});

module.exports = { getTasks, getTask, createTask, updateTask, updateStatus, deleteTask };


