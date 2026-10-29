
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bookings",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "BOOKING_CONFIRMED",
        "BOOKING_CANCELLED",
        "SCHEDULE_CHANGED",
        "JOURNEY_REMINDER",
        "PROMOTION",
        "GENERAL",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      default: "en",
    },

    channels: {
      type: [String],
      enum: ["in_app", "email", "push"],
      default: ["in_app"],
    },

    deliveryStatus: {
      in_app: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending",
      },
      email: {
        type: String,
        enum: ["pending", "sent", "failed", "skipped"],
        default: "skipped",
      },
      push: {
        type: String,
        enum: ["pending", "sent", "failed", "skipped"],
        default: "skipped",
      },
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    nextRetryAt: {
      type: Date,
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
