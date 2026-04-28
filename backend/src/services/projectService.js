// Purpose: Contains business logic and orchestrates repository calls.
// Manages project workflows: CRUD, team member management, invite system
// Handles permission checks (non-admins can only manage their projects)
// Uses transactions for consistency when updating team members
// Supports project invites via email with 7-day expiration
'use strict';
const { v4: uuidv4 } = require('uuid');
const AppError   = require('../utils/AppError');
const projectRepo = require('../repositories/projectRepository');
const notifRepo   = require('../repositories/notificationRepository');
const { sendProjectInvite } = require('./mailService');
const db          = require('../config/db');
const env         = require('../config/env');

// Color name mapping for project colors
const STATUS_COLOR_MAP = {
  '#3B82F6': 'blue', '#8B5CF6': 'purple', '#10B981': 'green',
  '#F59E0B': 'amber', '#EF4444': 'red', '#EC4899': 'pink',
  '#06B6D4': 'cyan', '#14B8A6': 'teal',
};

// GET all projects for user (role-aware: admins see all, others see only their projects)
// Enriches each project with full member list and metadata
async function getProjectsForUser(user) {
  let projects;
  if (user.role === 'admin') {
    // Admins can see all projects in system
    projects = await projectRepo.findAll();
  } else {
    // Non-admins only see projects they're members of
    projects = await projectRepo.findByUserId(user.id);
  }
  // Attach full member list to each project for frontend display
  for (const p of projects) {
    p.members = await projectRepo.getMembers(p.id);
  }
  return projects;
}

// Get single project with permission check
async function getProjectById(id, user) {
  const project = await projectRepo.findById(id);
  if (!project) throw new AppError('Project not found.', 404);

  // Admins can see any project; others must be members
  if (user.role !== 'admin') {
    const isMember = await projectRepo.isMember(id, user.id);
    if (!isMember) throw new AppError('You do not have access to this project.', 403);
  }
  project.members = await projectRepo.getMembers(id);
  return project;
}

// CREATE new project with transaction (ensure consistency across all operations)
// Automatically adds owner as first member, then adds selected team members
// Transaction ensures all-or-nothing semantics: project + members created together
async function createProject(data, ownerId) {
  const conn = await db.getConnection();
  try {
    // Start transaction to ensure atomic operations
    await conn.beginTransaction();
    const project = await projectRepo.create({ ...data, owner_id: ownerId }, conn);
    if (!project) throw new AppError('Failed to create project.', 500);
    // Add project creator/owner as default member
    await projectRepo.addMember(project.id, ownerId, conn);
    // Add selected team members from registration data
    if (data.teamMemberIds && data.teamMemberIds.length) {
      for (const uid of data.teamMemberIds) {
        await projectRepo.addMember(project.id, uid, conn);
      }
    }
    // Commit if all operations succeeded
    await conn.commit();
    project.members = await projectRepo.getMembers(project.id);
    return project;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// UPDATE project details and team members (permission controlled)
// Validates user is admin or project member; syncs employee list with transaction
async function updateProject(id, data, user) {
  const project = await projectRepo.findById(id);
  if (!project) throw new AppError('Project not found.', 404);
  // Admins can update any project; others must be members
  if (user.role !== 'admin') {
    const isMember = await projectRepo.isMember(id, user.id);
    if (!isMember) throw new AppError('Access denied to this project.', 403);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const updated = await projectRepo.update(id, data, conn);

    if (Array.isArray(data.teamMemberIds)) {
      const selectedEmployeeIds = [...new Set(data.teamMemberIds.map(Number).filter(Boolean))];
      const members = await projectRepo.getMembers(id, conn);
      const currentEmployeeIds = members
        .filter((m) => String(m.role || '').toLowerCase() === 'employee')
        .map((m) => Number(m.id));

      const removableEmployeeIds = currentEmployeeIds.filter((uid) => uid !== Number(project.owner_id));
      const toRemove = removableEmployeeIds.filter((uid) => !selectedEmployeeIds.includes(uid));
      const toAdd = selectedEmployeeIds.filter((uid) => !currentEmployeeIds.includes(uid));

      for (const uid of toRemove) {
        await projectRepo.removeMember(id, uid, conn);
      }
      for (const uid of toAdd) {
        await projectRepo.addMember(id, uid, conn);
      }
    }

    await conn.commit();
    updated.members = await projectRepo.getMembers(id);
    return updated;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getMembers(projectId, user) {
  if (user.role !== 'admin') {
    const isMember = await projectRepo.isMember(projectId, user.id);
    if (!isMember) throw new AppError('Access denied to this project.', 403);
  }
  return projectRepo.getMembers(projectId);
}

async function addMember(projectId, userId, actingUser) {
  const project = await projectRepo.findById(projectId);
  if (!project) throw new AppError('Project not found.', 404);
  if (actingUser.role !== 'admin') {
    const isMember = await projectRepo.isMember(projectId, actingUser.id);
    if (!isMember) throw new AppError('Access denied to this project.', 403);
  }
  await projectRepo.addMember(projectId, userId);
  return projectRepo.getMembers(projectId);
}

async function sendInvite(projectId, invitedByUser, email) {
  const project = await projectRepo.findById(projectId);
  if (!project) throw new AppError('Project not found.', 404);
  if (invitedByUser.role !== 'admin') {
    const isMember = await projectRepo.isMember(projectId, invitedByUser.id);
    if (!isMember) throw new AppError('Access denied to this project.', 403);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError('Recipient email is required.', 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError('Please enter a valid recipient email address.', 400);
  }

  const token      = uuidv4();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const inviteLink = `${env.CLIENT_URL}/invite/accept?token=${token}`;

  await projectRepo.saveInvite({ project_id: projectId, invited_by: invitedByUser.id, email: normalizedEmail, token, expires_at });
  const mailResult = await sendProjectInvite({
    toEmail: normalizedEmail,
    inviterName: invitedByUser.name || project.owner_name || 'Project Manager',
    inviterDepartment: invitedByUser.department || 'Administration',
    projectName: project.name,
    inviteUrl: inviteLink,
    expiresAt: expires_at,
  });

  await notifRepo.create({
    user_id: invitedByUser.id,
    type: 'invite',
    title: `Invite sent to ${normalizedEmail}`,
    description: `For project ${project.name}`,
    project_code: project.code || '',
  });

  return {
    email: normalizedEmail,
    inviteLink,
    mailSent: mailResult.sent,
    projectName: project.name,
    expiresAt: expires_at,
  };
}

async function acceptInvite(token, user) {
  const invite = await projectRepo.findInviteByToken(token);
  if (!invite) throw new AppError('Invalid invite link.', 404);

  const now = new Date();
  if (new Date(invite.expires_at).getTime() < now.getTime()) {
    throw new AppError('Invite link has expired.', 410);
  }

  // Validate invite email matches logged-in user (case-insensitive)
  if (String(invite.email).toLowerCase() !== String(user.email).toLowerCase()) {
    throw new AppError('This invite is for a different email account.', 403);
  }

  const project = await projectRepo.findById(invite.project_id);
  if (!project) throw new AppError('Project not found.', 404);

  await projectRepo.addMember(invite.project_id, user.id);
  if (!invite.is_accepted) {
    await projectRepo.markInviteAccepted(invite.id);
  }

  await notifRepo.create({
    user_id: invite.invited_by,
    type: 'invite',
    title: `${user.name} accepted invite`,
    description: `Joined project ${project.name}`,
    project_code: project.code || '',
  });

  project.members = await projectRepo.getMembers(project.id);
  return {
    project,
    accepted: true,
  };
}

module.exports = { getProjectsForUser, getProjectById, createProject, updateProject, getMembers, addMember, sendInvite, acceptInvite };
