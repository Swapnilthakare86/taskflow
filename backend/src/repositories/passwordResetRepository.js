'use strict';
const db = require('../config/db');

async function create({ userId, tokenHash, expiresAt }) {
  await db.execute(
    `INSERT INTO password_resets (user_id, token_hash, expires_at, is_used) VALUES (?, ?, ?, 0)`,
    [userId, tokenHash, expiresAt]
  );
}

async function findValidByTokenHash(tokenHash) {
  const [rows] = await db.execute(
    `SELECT id, user_id, token_hash, expires_at, is_used
     FROM password_resets
     WHERE token_hash = ? AND is_used = 0 AND expires_at > NOW()
     ORDER BY id DESC
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function markUsed(id) {
  await db.execute(`UPDATE password_resets SET is_used = 1 WHERE id = ?`, [id]);
}

async function invalidateAllByUserId(userId) {
  await db.execute(`UPDATE password_resets SET is_used = 1 WHERE user_id = ? AND is_used = 0`, [userId]);
}

module.exports = { create, findValidByTokenHash, markUsed, invalidateAllByUserId };
