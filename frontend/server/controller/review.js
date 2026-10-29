
const mongoose = require("mongoose");
const Review = require("../models/review");
const Booking = require("../models/booking");

const MIN_REVIEW_LENGTH = 20;
const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const REPORT_LIMIT = 3;

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function completedBooking(status) {
  return String(status || "").trim().toLowerCase() === "completed";
}

// Submit a review for a completed booking.
exports.createReview = async (req, res) => {
  try {
    if (!req.user?.isVerified) {
      return res.status(403).json({
        message: "A verified account is required to submit a review.",
      });
    }

    const { bookingId, rating, comment } = req.body;

    if (!validId(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be a whole number from 1 to 5.",
      });
    }

    if (typeof comment !== "string" ||
        comment.trim().length < MIN_REVIEW_LENGTH ||
        comment.trim().length > 1000) {
      return res.status(400).json({
        message: "Review must contain 20–1000 characters.",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      customerId: String(req.user._id),
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found for this account.",
      });
    }

    if (!completedBooking(booking.status)) {
      return res.status(403).json({
        message: "You can review a journey only after it is completed.",
      });
    }

    const existingReview = await Review.findOne({ bookingId });

    if (existingReview) {
      return res.status(409).json({
        message: "You have already reviewed this booking.",
      });
    }

    const review = await Review.create({
      customerId: req.user._id,
      customerName: req.user.name,
      bookingId: booking._id,
      busId: String(booking.busId),
      departureCity: booking.departureDetails.city,
      arrivalCity: booking.arrivalDetails.city,
      rating,
      comment: comment.trim(),
    });

    return res.status(201).json({
      message: "Review submitted successfully.",
      review,
    });
  } catch (error) {
    // Also handles simultaneous duplicate submissions.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This booking already has a review.",
      });
    }

    console.error("Create review error:", error);
    return res.status(500).json({ message: "Unable to submit review." });
  }
};

// Get recent reviews and average rating for a bus.
exports.getReviews = async (req, res) => {
  try {
    const busId = String(req.params.busId || "").trim();

    if (!busId) {
      return res.status(400).json({ message: "Bus ID is required." });
    }

    const match = { busId, isHidden: false };

    const [summary] = await Review.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const reviews = await Review.find(match)
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "customerName rating comment createdAt updatedAt helpfulVotedBy"
      )
      .lean();

    const formattedReviews = reviews.map((review) => ({
      ...review,
      helpfulCount: review.helpfulVotedBy.length,
      trustedReviewer: review.helpfulVotedBy.length >= 5,
      helpfulVotedBy: undefined,
    }));

    return res.json({
      busId,
      averageRating: summary
        ? Number(summary.averageRating.toFixed(1))
        : 0,
      totalReviews: summary ? summary.totalReviews : 0,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return res.status(500).json({ message: "Unable to load reviews." });
  }
};

// Edit the review within 24 hours. The rating is also locked after 24 hours.
exports.editReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!validId(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID." });
    }

    const review = await Review.findOne({
      _id: reviewId,
      customerId: req.user._id,
      isHidden: false,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (Date.now() - review.createdAt.getTime() > EDIT_WINDOW_MS) {
      return res.status(403).json({
        message: "The 24-hour editing period has expired.",
      });
    }

    if (rating !== undefined &&
        (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({
        message: "Rating must be a whole number from 1 to 5.",
      });
    }

    if (comment !== undefined &&
        (typeof comment !== "string" ||
         comment.trim().length < MIN_REVIEW_LENGTH ||
         comment.trim().length > 1000)) {
      return res.status(400).json({
        message: "Review must contain 20–1000 characters.",
      });
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment.trim();

    await review.save();

    return res.json({
      message: "Review updated successfully.",
      review,
    });
  } catch (error) {
    console.error("Edit review error:", error);
    return res.status(500).json({ message: "Unable to update review." });
  }
};

// A user can report a review only once.
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!validId(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID." });
    }

    const review = await Review.findOne({
      _id: reviewId,
      isHidden: false,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (review.customerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot report your own review.",
      });
    }

    const alreadyReported = review.reportedBy.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return res.status(409).json({
        message: "You have already reported this review.",
      });
    }

    review.reportedBy.push(req.user._id);
    review.reportCount = review.reportedBy.length;

    if (review.reportCount >= REPORT_LIMIT) {
      review.isHidden = true;
      review.hiddenReason = "Automatically hidden after multiple reports";
    }

    await review.save();

    return res.json({
      message: review.isHidden
        ? "Review hidden pending moderation."
        : "Report submitted successfully.",
      isHidden: review.isHidden,
    });
  } catch (error) {
    console.error("Report review error:", error);
    return res.status(500).json({ message: "Unable to report review." });
  }
};

// Mark a review as helpful. Each user can vote once per review.
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!validId(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID." });
    }

    const review = await Review.findOne({
      _id: reviewId,
      isHidden: false,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (review.customerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot vote for your own review.",
      });
    }

    const alreadyVoted = review.helpfulVotedBy.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyVoted) {
      return res.status(409).json({
        message: "You have already marked this review helpful.",
      });
    }

    review.helpfulVotedBy.push(req.user._id);
    await review.save();

    return res.json({
      message: "Vote recorded.",
      helpfulCount: review.helpfulVotedBy.length,
      trustedReviewer: review.helpfulVotedBy.length >= 5,
    });
  } catch (error) {
    console.error("Helpful vote error:", error);
    return res.status(500).json({ message: "Unable to record vote." });
  }
};
