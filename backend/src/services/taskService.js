// Purpose: Contains business logic and orchestrates repository calls.
// Manages task workflows: creation, status updates, assignments
// Handles permission checks (non-admins can only access their project tasks)
// Triggers notifications for task events (creation, status change, assignment)
'use strict';
const AppError = require('../utils/AppError');
const taskRepo = require('../repositories/taskRepository');
const projectRepo = require('../repositories/projectRepository');
const notifRepo = require('../repositories/notificationRepository');

// HELPER: Broadcast notification to multiple users for task event
// Deduplicates user IDs and creates notification record for each
async function createNotificationForUsers(userIds, payload) {
  const uniqueIds = [...new Set(userIds.map(Number).filter(Boolean))];
  for (const uid of uniqueIds) {
    await notifRepo.create({
      user_id: uid,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      project_code: payload.project_code,
    });
  }
}

// GET all tasks in project with permission check (non-admins can only see their own projects)
// Admins bypass project membership check; others must be team members
async function getTasksByProject(projectId, user) {
  if (user.role !== 'admin') {
    // Non-admins must be project members to view tasks
    const ok = await projectRepo.isMember(projectId, user.id);
    if (!ok) throw new AppError('Access denied to this project.', 403);
  }
  return taskRepo.findByProjectId(projectId);
}

async function getTaskById(id) {
  const task = await taskRepo.findById(id);
  if (!task) throw new AppError('Task not found.', 404);
  return task;
}

// CREATE new task with validation and notification triggers
// Validates assignee is project member; notifies reporter, assignee, and project owner
async function createTask(projectId, data, reporter) {
  // Fetch project members to validate assignee
  const memberIds = await projectRepo.getMemberIds(projectId);
  if (!memberIds.includes(Number(data.assigneeId))) {
    throw new AppError('Assignee must be a member of this project.', 400);
  }

  const task = await taskRepo.create({
    project_id: projectId,
    title: data.title,
    description: data.description,
    assignee_id: data.assigneeId,
    reporter_id: reporter.id,
    status: data.status || 'To Do',
    priority: data.priority || 'Medium',
    due_date: data.dueDate || null,
    tags: data.tags || [],
  });

  const project = await projectRepo.findById(projectId);

  await createNotificationForUsers([Number(reporter.id)], {
    type: 'status',
    title: `Task "${task.title}" created`,
    description: `Created by ${reporter.name}`,
    project_code: project?.code || '',
  });

  if (Number(data.assigneeId) !== Number(reporter.id)) {
    await createNotificationForUsers([Number(data.assigneeId)], {
      type: 'assigned',
      title: `You were assigned to task #${task.id}`,
      description: `${task.title} - assigned by ${reporter.name}`,
      project_code: project?.code || '',
    });
  }

  if (project?.owner_id && Number(project.owner_id) !== Number(reporter.id)) {
    await createNotificationForUsers([Number(project.owner_id)], {
      type: 'status',
      title: `Task "${task.title}" created`,
      description: `Created by ${reporter.name}`,
      project_code: project?.code || '',
    });
  }

  return task;
}

// UPDATE task status (To Do -> In Progress -> Done -> Blocked)
// Enforces role-based status rules: clients can only set to Blocked
// Validates user is project member (except admins)
// Triggers notifications to reporter, assignee, and owner
async function updateTaskStatus(id, status, updater) {
  const task = await taskRepo.findById(id);
  if (!task) throw new AppError('Task not found.', 404);
  // Clients have limited permissions: only can block tasks (not progress them)
  if (updater.role === 'client' && status !== 'Blocked') {
    throw new AppError('Client can move tasks only to Blocked.', 403);
  }
  // Non-admins must be project members
  if (updater.role !== 'admin') {
    const member = await projectRepo.isMember(task.project_id, updater.id);
    if (!member) throw new AppError('Access denied to this project.', 403);
  }

  const updated = await taskRepo.updateStatus(id, status);
  const project = await projectRepo.findById(task.project_id);
  const notifyType = status === 'Done' ? 'done' : 'status';

  await createNotificationForUsers([Number(updater.id)], {
    type: notifyType,
    title: `Task "${task.title}" updated to ${status}`,
    description: `Updated by ${updater.name}`,
    project_code: project?.code || '',
  });

  if (task.assignee_id && Number(task.assignee_id) !== Number(updater.id)) {
    await createNotificationForUsers([Number(task.assignee_id)], {
      type: notifyType,
      title: `Task #${task.id} moved to ${status}`,
      description: `${task.title} - moved by ${updater.name}`,
      project_code: project?.code || '',
    });
  }

  if (project?.owner_id && Number(project.owner_id) !== Number(updater.id)) {
    await createNotificationForUsers([Number(project.owner_id)], {
      type: notifyType,
      title: `Task "${task.title}" updated to ${status}`,
      description: `Updated by ${updater.name}`,
      project_code: project?.code || '',
    });
  }

  return updated;
}

async function updateTask(id, data, user) {
  const task = await taskRepo.findById(id);
  if (!task) throw new AppError('Task not found.', 404);

  if (user.role !== 'admin') {
    const isMember = await projectRepo.isMember(task.project_id, user.id);
    if (!isMember) throw new AppError('Access denied to this project.', 403);
  }

  if (data.assigneeId !== undefined) {
    const memberIds = await projectRepo.getMemberIds(task.project_id);
    if (!memberIds.includes(Number(data.assigneeId))) {
      throw new AppError('Assignee must be a member of this project.', 400);
    }
  }

  const mapped = {};
  if (data.title !== undefined) mapped.title = data.title;
  if (data.description !== undefined) mapped.description = data.description;
  if (data.assigneeId !== undefined) mapped.assignee_id = data.assigneeId;
  if (data.status !== undefined) mapped.status = data.status;
  if (data.priority !== undefined) mapped.priority = data.priority;
  if (data.dueDate !== undefined) mapped.due_date = data.dueDate;
  if (data.tags !== undefined) mapped.tags = data.tags;

  return taskRepo.update(id, mapped);
}

async function deleteTask(id) {
  const task = await taskRepo.findById(id);
  if (!task) throw new AppError('Task not found.', 404);
  await taskRepo.remove(id);
}

module.exports = { getTasksByProject, getTaskById, createTask, updateTaskStatus, updateTask, deleteTask };


