// Purpose: Executes database queries and returns data models.
// Data access layer for project CRUD and team member management
// Includes complex joins for task aggregation (count, status breakdown, completion %)
// Manages project-member associations and project invites
'use strict';
const db = require('../config/db');

// Define columns for project queries with aggregated task statistics
// Includes owner info (name, initials, color) and calculated task metrics
const PROJECT_COLS = `
  p.id, p.name, p.code, p.description, p.color, p.status,
  p.deadline, p.owner_id, p.created_at, p.updated_at,
  u.name AS owner_name, u.initials AS owner_initials, u.avatar_color AS owner_color,
  COALESCE(ta.tasks_total, 0) AS tasks_total,
  COALESCE(ta.tasks_done, 0) AS tasks_done,
  COALESCE(ta.tasks_inprog, 0) AS tasks_inprog,
  COALESCE(ta.tasks_active, 0) AS tasks_active,
  COALESCE(ta.progress, 0) AS progress`;

// LEFT JOIN to get task aggregations (count, completion %) per project
// Calculated in subquery: total tasks, done count, in-progress count, completion percentage
const TASK_AGG_JOIN = `
  LEFT JOIN (
    SELECT
      t.project_id,
      COUNT(*) AS tasks_total,
      SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) AS tasks_done,
      SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) AS tasks_inprog,
      SUM(CASE WHEN t.status <> 'Done' THEN 1 ELSE 0 END) AS tasks_active,
      CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) * 100 / COUNT(*))
      END AS progress
    FROM tasks t
    GROUP BY t.project_id
  ) ta ON ta.project_id = p.id`;

// FIND all projects in the system (admin view)
// Includes owner and aggregated task statistics
async function findAll() {
  const [rows] = await db.execute(
    `SELECT ${PROJECT_COLS} FROM projects p
     LEFT JOIN users u ON u.id = p.owner_id
     ${TASK_AGG_JOIN}
     ORDER BY p.created_at DESC`
  );
  return rows;
}

// FIND all projects user is a member of (user-scoped view)
// INNER JOINs project_members to filter only projects user has access to
// Includes same aggregated statistics and owner info
async function findByUserId(userId) {
  const [rows] = await db.execute(
    `SELECT ${PROJECT_COLS}
     FROM projects p
     LEFT JOIN users u ON u.id = p.owner_id
     ${TASK_AGG_JOIN}
     INNER JOIN project_members pm ON pm.project_id = p.id
     WHERE pm.user_id = ?
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return rows;
}

// Get single project by ID with stats
async function findById(id) {
  const [rows] = await db.execute(
    `SELECT ${PROJECT_COLS} FROM projects p
     LEFT JOIN users u ON u.id = p.owner_id
     ${TASK_AGG_JOIN}
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findByIdWithConn(id, conn = db) {
  const [rows] = await conn.execute(
    `SELECT ${PROJECT_COLS} FROM projects p
     LEFT JOIN users u ON u.id = p.owner_id
     ${TASK_AGG_JOIN}
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function create(data, conn = db) {
  const { name, code, description, color, deadline, owner_id } = data;
  const [result] = await conn.execute(
    `INSERT INTO projects (name, code, description, color, deadline, owner_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, code, description || null, color || '#3B82F6', deadline || null, owner_id]
  );
  return findByIdWithConn(result.insertId, conn);
}

async function update(id, fields, conn = db) {
  const allowed = ['name', 'code', 'description', 'color', 'status', 'progress', 'deadline'];
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (!entries.length) return findById(id);
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values     = entries.map(([, v]) => v);
  await conn.execute(`UPDATE projects SET ${setClauses} WHERE id = ?`, [...values, id]);
  return findById(id);
}

async function getMemberIds(projectId) {
  const [rows] = await db.execute(
    `SELECT user_id FROM project_members WHERE project_id = ?`,
    [projectId]
  );
  return rows.map(r => r.user_id);
}

async function getMembers(projectId, conn = db) {
  const [rows] = await conn.execute(
    `SELECT u.id, u.name, u.email, u.role, u.department, u.avatar_color, u.initials, pm.joined_at
     FROM project_members pm
     INNER JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ?
     ORDER BY u.name ASC`,
    [projectId]
  );
  return rows;
}

async function addMember(projectId, userId, conn = db) {
  await conn.execute(
    `INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`,
    [projectId, userId]
  );
}

async function removeMember(projectId, userId, conn = db) {
  await conn.execute(
    `DELETE FROM project_members WHERE project_id = ? AND user_id = ?`,
    [projectId, userId]
  );
}

async function isMember(projectId, userId) {
  const [rows] = await db.execute(
    `SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ? LIMIT 1`,
    [projectId, userId]
  );
  return rows.length > 0;
}

async function saveInvite(data) {
  const { project_id, invited_by, email, token, expires_at } = data;
  await db.execute(
    `INSERT INTO invites (project_id, invited_by, email, token, expires_at) VALUES (?,?,?,?,?)`,
    [project_id, invited_by, email, token, expires_at]
  );
}

async function findInviteByToken(token) {
  const [rows] = await db.execute(
    `SELECT id, project_id, invited_by, email, token, is_accepted, created_at, expires_at
     FROM invites
     WHERE token = ?
     LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

async function markInviteAccepted(inviteId) {
  await db.execute(
    `UPDATE invites
     SET is_accepted = 1
     WHERE id = ?`,
    [inviteId]
  );
}

module.exports = {
  findAll, findByUserId, findById, findByIdWithConn, create, update,
  getMemberIds, getMembers, addMember, removeMember, isMember, saveInvite,
  findInviteByToken, markInviteAccepted,
};

