'use strict';
const mysql = require('mysql2/promise');
const env   = require('./env');

const pool = mysql.createPool({
  host:               env.DB_HOST,
  port:               env.DB_PORT,
  user:               env.DB_USER,
  password:           env.DB_PASSWORD,
  database:           env.DB_NAME,
  connectionLimit:    env.DB_CONNECTION_LIMIT,
  charset:            'utf8mb4',
  timezone:           '+00:00',
  waitForConnections: true,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
});

// Verify on startup
pool.getConnection()
  .then(conn => {
    console.log('MySQL connected to', env.DB_NAME);
    conn.release();
  })
  .catch(err => {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
