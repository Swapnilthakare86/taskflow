// Purpose: Handles HTTP requests and maps them to service-layer actions.
'use strict';
const asyncHandler   = require('../utils/asyncHandler');
const { success }    = require('../utils/apiResponse');
const notifService   = require('../services/notificationService');

// Get all notifications for current user
const getNotifications = asyncHandler(async (req, res) => {
  const data = await notifService.getForUser(req.user.id);
  success(res, data, 'Notifications retrieved');
});

// Get count of unread notifications
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notifService.getUnreadCount(req.user.id);
  success(res, { count }, 'Unread count');
});

// Mark single notification as read
const markRead = asyncHandler(async (req, res) => {
  await notifService.markOneRead(Number(req.params.id), req.user.id);
  success(res, null, 'Marked as read');
});

// Mark all notifications as read
const markAllRead = asyncHandler(async (req, res) => {
  await notifService.markAllRead(req.user.id);
  success(res, null, 'All marked as read');
});

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };


