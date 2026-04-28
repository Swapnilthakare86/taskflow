// Purpose: Executes database queries and returns data models.
'use strict';
const db = require('../config/db');

// Define safe columns to exclude sensitive data (passwords)
const SAFE_COLS = 'id, name, email, role, department, avatar_color, initials, is_active, created_at';

// Find user by ID (excludes password hash for public queries)
async function findById(id) {
  const [rows] = await db.execute(
    `SELECT ${SAFE_COLS} FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

// Find user by email (includes password hash for auth purposes)
async function findByEmail(email) {
  const [rows] = await db.execute(
    `SELECT id, name, email, password_hash, role, department, avatar_color, initials, is_active
     FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findAuthById(id) {
  const [rows] = await db.execute(
    `SELECT id, name, email, password_hash, role, department, avatar_color, initials, is_active
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findAll() {
  const [rows] = await db.execute(
    `SELECT ${SAFE_COLS} FROM users ORDER BY name ASC`
  );
  return rows;
}

async function findAllEmployees() {
  const [rows] = await db.execute(
    `SELECT ${SAFE_COLS} FROM users WHERE role = 'employee' AND is_active = 1 ORDER BY name ASC`
  );
  return rows;
}

// Update user profile (only allows specific fields to prevent unauthorized changes)
async function update(id, fields) {
  const allowed = ['name', 'department', 'avatar_color', 'initials'];
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (!entries.length) return null;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values     = entries.map(([, v]) => v);
  await db.execute(`UPDATE users SET ${setClauses} WHERE id = ?`, [...values, id]);
  return findById(id);
}

async function create({ name, email, passwordHash, role, department, avatarColor, initials }) {
  const [result] = await db.execute(
    `INSERT INTO users
      (name, email, password_hash, role, department, avatar_color, initials, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [name, email, passwordHash, role, department, avatarColor, initials]
  );
  return findById(result.insertId);
}

async function updatePasswordHash(id, passwordHash) {
  await db.execute(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [passwordHash, id]
  );
}

module.exports = {
  findById, findByEmail, findAuthById, findAll, findAllEmployees, update, create, updatePasswordHash,
};


