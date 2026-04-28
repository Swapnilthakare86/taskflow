'use strict';
const db = require('../config/db');
const { TASK_STATUSES } = require('../validators/taskConstants');

async function getSummary(projectId) {
  const [rows] = await db.execute(
    `SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) AS done,
      SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) AS blocked
     FROM tasks
     WHERE project_id = ?`,
    [projectId]
  );
  const row = rows[0] || {};
  return {
    total: Number(row.total || 0),
    inProgress: Number(row.in_progress || 0),
    done: Number(row.done || 0),
    blocked: Number(row.blocked || 0),
  };
}

async function getStatusDist(projectId) {
  const [rows] = await db.execute(
    `SELECT status, COUNT(*) AS count FROM tasks WHERE project_id = ? GROUP BY status`,
    [projectId]
  );
  const map = Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]));
  return TASK_STATUSES.map((status) => ({ status, count: map[status] || 0 }));
}

async function getTrend(projectId) {
  const [rows] = await db.execute(
    `SELECT
      DATE_FORMAT(created_at, '%Y-%m-%d') AS day,
      COUNT(*) AS added,
      SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) AS completed
     FROM tasks
     WHERE project_id = ?
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    [projectId]
  );

  const last4 = rows.slice(-4);
  return last4.map((row, i) => ({
    week: `Wk ${i + 1}`,
    added: Number(row.added || 0),
    completed: Number(row.completed || 0),
  }));
}

async function getWorkload(projectId) {
  const [rows] = await db.execute(
    `SELECT
      u.id,
      u.name,
      u.initials,
      u.avatar_color,
      u.role,
      COUNT(t.id) AS assigned,
      SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) AS done,
      SUM(CASE WHEN t.status = 'In Review' THEN 1 ELSE 0 END) AS review,
      SUM(CASE WHEN t.status = 'Blocked' THEN 1 ELSE 0 END) AS blocked
     FROM project_members pm
     INNER JOIN users u ON u.id = pm.user_id
     LEFT JOIN tasks t ON t.assignee_id = u.id AND t.project_id = pm.project_id
     WHERE pm.project_id = ?
     GROUP BY u.id, u.name, u.initials, u.avatar_color, u.role
     ORDER BY u.name ASC`,
    [projectId]
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    initials: r.initials,
    avatar_color: r.avatar_color,
    role: r.role,
    assigned: Number(r.assigned || 0),
    active: Number(r.active || 0),
    done: Number(r.done || 0),
    review: Number(r.review || 0),
    blocked: Number(r.blocked || 0),
  }));
}

module.exports = { getSummary, getStatusDist, getTrend, getWorkload };
