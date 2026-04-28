'use strict';
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET', 'CLIENT_URL'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error('Missing required env vars: ' + missing.join(', '));
}

const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || (smtpUser && smtpPass ? 'smtp.zoho.in' : '');
const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || (smtpHost ? 465 : 587));
const smtpSecureDefault = smtpPort === 465 ? 'true' : 'false';

module.exports = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_CONNECTION_LIMIT: Number(process.env.DB_CONNECTION_LIMIT || 10),
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL,
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 12),
  SMTP_HOST: smtpHost,
  SMTP_PORT: smtpPort,
  SMTP_SECURE: String(process.env.SMTP_SECURE || process.env.EMAIL_SECURE || smtpSecureDefault) === 'true',
  SMTP_USER: smtpUser,
  SMTP_PASS: smtpPass,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'TaskFlow',
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || smtpUser || '',
  ALLOWED_EMAIL_DOMAINS: String(process.env.ALLOWED_EMAIL_DOMAINS || 'xtsworld.in,gmail.com')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
};
