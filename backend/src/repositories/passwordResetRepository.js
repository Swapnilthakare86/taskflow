'use strict';
const db = require('../config/db');

async function create({ userId, tokenHash, expiresAt }) {
  await db.execute(
    `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );
}

async function findValidByTokenHash(tokenHash) {
  const [rows] = await db.execute(
    `SELECT id, user_id, token_hash, expires_at, used_at
     FROM password_resets
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
     ORDER BY id DESC
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function markUsed(id) {
  await db.execute(`UPDATE password_resets SET used_at = NOW() WHERE id = ?`, [id]);
}

async function invalidateAllByUserId(userId) {
  await db.execute(`UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL`, [userId]);
}

module.exports = { create, findValidByTokenHash, markUsed, invalidateAllByUserId };
