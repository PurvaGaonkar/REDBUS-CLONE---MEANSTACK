
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customers",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bookings",
      required: true,
    },
    busId: {
      type: String,
      required: true,
      index: true,
    },
    departureCity: {
      type: String,
      required: true,
    },
    arrivalCity: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number from 1 to 5.",
      },
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: [20, "Review must contain at least 20 characters."],
      maxlength: [1000, "Review cannot exceed 1000 characters."],
    },
    helpfulVotedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customers",
    }],
    reportedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customers",
    }],
    reportCount: {
      type: Number,
      default: 0,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    hiddenReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// One review per booking, even if multiple requests arrive simultaneously.
reviewSchema.index({ bookingId: 1 }, { unique: true });
reviewSchema.index({ busId: 1, isHidden: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
