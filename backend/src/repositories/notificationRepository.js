'use strict';
const db = require('../config/db');

async function findByUserId(userId) {
  const [rows] = await db.execute(
    `SELECT id, user_id, type, title, description, project_code, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [userId]
  );
  return rows;
}

async function getUnreadCount(userId) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return Number(rows[0]?.count || 0);
}

async function create({ user_id, type, title, description, project_code }) {
  await db.execute(
    `INSERT INTO notifications (user_id, type, title, description, project_code, is_read)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [user_id, type, title, description || null, project_code || null]
  );
}

async function markRead(id, userId) {
  const [res] = await db.execute(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return res.affectedRows > 0;
}

async function markAllRead(userId) {
  await db.execute(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId]);
}

module.exports = { findByUserId, getUnreadCount, create, markRead, markAllRead };
