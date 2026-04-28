// Purpose: Contains business logic and orchestrates repository calls.
'use strict';
const notifRepo = require('../repositories/notificationRepository');

// Get all notifications for user
async function getForUser(userId) {
  return notifRepo.findByUserId(userId);
}

// Get count of unread notifications
async function getUnreadCount(userId) {
  return notifRepo.getUnreadCount(userId);
}

// Mark single notification as read
async function markOneRead(id, userId) {
  const ok = await notifRepo.markRead(id, userId);
  if (!ok) {
    const AppError = require('../utils/AppError');
    throw new AppError('Notification not found or not yours.', 404);
  }
}

// Mark all notifications as read for a user
async function markAllRead(userId) {
  await notifRepo.markAllRead(userId);
}

module.exports = { getForUser, getUnreadCount, markOneRead, markAllRead };


