
const mongoose = require("mongoose");

const notificationPreferencesSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    emailEnabled: {
      type: Boolean,
      default: true,
    },

    pushEnabled: {
      type: Boolean,
      default: false,
    },

    inAppEnabled: {
      type: Boolean,
      default: true,
    },

    promotionalEnabled: {
      type: Boolean,
      default: false,
    },

    language: {
      type: String,
      enum: ["en", "hi", "mr"],
      default: "en",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "NotificationPreferences",
  notificationPreferencesSchema
);
