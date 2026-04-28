'use strict';
const nodemailer = require('nodemailer');
const env = require('../config/env');
const AppError = require('../utils/AppError');

function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function getTransport() {
  if (!hasSmtpConfig()) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

function fromField() {
  return env.SMTP_FROM_EMAIL
    ? `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`
    : env.SMTP_USER;
}

async function sendMailSafe({ to, subject, html, text }) {
  const transport = getTransport();
  if (!transport) {
    throw new AppError('Email service is not configured. Please check SMTP settings in backend .env.', 500);
  }

  try {
    const info = await transport.sendMail({ from: fromField(), to, subject, html, text });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[mail:error]', {
      code: err.code,
      command: err.command,
      responseCode: err.responseCode,
      message: err.message,
    });

    if (err.code === 'EAUTH' || err.responseCode === 535) {
      throw new AppError('Zoho mail login failed. Please use the correct Zoho app password in backend .env.', 502);
    }
    if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT' || err.code === 'ESOCKET') {
      throw new AppError('Could not connect to Zoho SMTP. Please check SMTP host, port, secure setting, and internet access.', 502);
    }

    throw new AppError('Invite email could not be sent. Please check Zoho SMTP settings and try again.', 502);
  }
}

async function sendPasswordReset({ toEmail, userName, resetUrl }) {
  const subject = 'Reset your TaskFlow password';
  const text = [
    `Hi ${userName},`,
    '',
    'We received a request to reset your password.',
    `Reset link: ${resetUrl}`,
    '',
    'This link expires in 15 minutes.',
  ].join('\n');
  const html = `<p>Hi ${userName},</p><p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link expires in 15 minutes.</p>`;
  return sendMailSafe({ to: toEmail, subject, text, html });
}

async function sendProjectInvite({ toEmail, inviterName, inviterDepartment, projectName, inviteUrl }) {
  const subject = `Invitation to join "${projectName}"`;
  const text = [
    'Hi,',
    '',
    `You've been invited to collaborate on the "${projectName}" project.`,
    '',
    'Click the link below to accept your invitation:',
    inviteUrl,
    '',
    'Best regards,',
    inviterName,
    inviterDepartment || '',
  ].join('\n');
  const html = `<p>Hi,</p><p>You've been invited to collaborate on the "${projectName}" project.</p><p><a href="${inviteUrl}">Accept Invitation</a></p><p>Best regards,<br/>${inviterName}<br/>${inviterDepartment || ''}</p>`;
  return sendMailSafe({ to: toEmail, subject, text, html });
}

module.exports = { sendPasswordReset, sendProjectInvite };
