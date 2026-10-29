
const express = require("express");
const router = express.Router();

const notificationController = require("../controller/notification");

// Notification history
router.get(
  "/:customerId",
  notificationController.getNotifications
);

// Unread notification count
router.get(
  "/:customerId/unread-count",
  notificationController.getUnreadCount
);

// Mark a notification as read
router.patch(
  "/:customerId/:notificationId/read",
  notificationController.markAsRead
);

// Get notification preferences
router.get(
  "/:customerId/preferences",
  notificationController.getPreferences
);

// Update notification preferences
router.patch(
  "/:customerId/preferences",
  notificationController.updatePreferences
);

module.exports = router;
