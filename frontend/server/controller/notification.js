
const Notification = require("../models/notification");
const NotificationPreferences = require("../models/notificationPreferences");

// Get or create a user's notification preferences
exports.getPreferences = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const preferences = await NotificationPreferences.findOneAndUpdate(
      { customerId },
      { $setOnInsert: { customerId } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(preferences);
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ message: "Unable to load preferences" });
  }
};

// Update a user's notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { customerId } = req.params;
    const allowedFields = [
      "emailEnabled",
      "pushEnabled",
      "inAppEnabled",
      "promotionalEnabled",
      "language",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid preferences provided" });
    }

    const preferences = await NotificationPreferences.findOneAndUpdate(
      { customerId },
      { $set: updates, $setOnInsert: { customerId } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(preferences);
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ message: "Unable to update preferences" });
  }
};

// Get notification history for a customer
exports.getNotifications = async (req, res) => {
  try {
    const { customerId } = req.params;
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );

    const notifications = await Notification.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Unable to load notifications" });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { customerId, notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, customerId },
      { $set: { read: true } },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ message: "Unable to update notification" });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const { customerId } = req.params;
    const count = await Notification.countDocuments({
      customerId,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    console.error("Unread count error:", error);
    res.status(500).json({ message: "Unable to get unread count" });
  }
};
