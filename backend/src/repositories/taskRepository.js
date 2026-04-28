'use strict';
const db = require('../config/db');

const TASK_COLS = `
  t.id, t.project_id, t.title, t.description, t.status, t.priority,
  t.due_date, t.comment_count, t.attachment_count, t.created_at, t.updated_at,
  t.assignee_id, t.reporter_id,
  a.name AS assignee_name, a.initials AS assignee_initials, a.avatar_color AS assignee_color,
  r.name AS reporter_name`;

async function findByProjectId(projectId) {
  const [rows] = await db.execute(
    `SELECT ${TASK_COLS}
     FROM tasks t
     LEFT JOIN users a ON a.id = t.assignee_id
     LEFT JOIN users r ON r.id = t.reporter_id
     WHERE t.project_id = ?
     ORDER BY t.created_at ASC`,
    [projectId]
  );

  const taskIds = rows.map((r) => r.id);
  if (!taskIds.length) return [];

  const placeholders = taskIds.map(() => '?').join(',');
  const [tagRows] = await db.execute(
    `SELECT task_id, tag FROM task_tags WHERE task_id IN (${placeholders})`,
    taskIds
  );

  const tagMap = {};
  tagRows.forEach(({ task_id, tag }) => {
    if (!tagMap[task_id]) tagMap[task_id] = [];
    tagMap[task_id].push(tag);
  });

  return rows.map((t) => ({ ...t, tags: tagMap[t.id] || [] }));
}

async function findById(id) {
  const [rows] = await db.execute(
    `SELECT ${TASK_COLS}
     FROM tasks t
     LEFT JOIN users a ON a.id = t.assignee_id
     LEFT JOIN users r ON r.id = t.reporter_id
     WHERE t.id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;

  const [tagRows] = await db.execute(`SELECT tag FROM task_tags WHERE task_id = ?`, [id]);
  return { ...rows[0], tags: tagRows.map((r) => r.tag) };
}

async function create(data) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { project_id, title, description, assignee_id, reporter_id, status, priority, due_date, tags } = data;
    const [result] = await conn.execute(
      `INSERT INTO tasks (project_id, title, description, assignee_id, reporter_id, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, title, description || null, assignee_id, reporter_id, status || 'To Do', priority || 'Medium', due_date || null]
    );

    const taskId = result.insertId;
    for (const tag of (tags || [])) {
      await conn.execute(`INSERT INTO task_tags (task_id, tag) VALUES (?, ?)`, [taskId, tag]);
    }

    await conn.commit();
    return findById(taskId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function updateStatus(id, status) {
  await db.execute(`UPDATE tasks SET status = ? WHERE id = ?`, [status, id]);
  return findById(id);
}

async function update(id, data) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const allowed = ['title', 'description', 'assignee_id', 'status', 'priority', 'due_date'];
    const entries = Object.entries(data).filter(([k]) => allowed.includes(k));

    if (entries.length) {
      const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
      const values = entries.map(([, v]) => v);
      await conn.execute(`UPDATE tasks SET ${setClauses} WHERE id = ?`, [...values, id]);
    }

    if (data.tags !== undefined) {
      await conn.execute(`DELETE FROM task_tags WHERE task_id = ?`, [id]);
      for (const tag of (data.tags || [])) {
        await conn.execute(`INSERT INTO task_tags (task_id, tag) VALUES (?, ?)`, [id, tag]);
      }
    }

    await conn.commit();
    return findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function remove(id) {
  await db.execute(`DELETE FROM tasks WHERE id = ?`, [id]);
}

module.exports = { findByProjectId, findById, create, updateStatus, update, remove };
