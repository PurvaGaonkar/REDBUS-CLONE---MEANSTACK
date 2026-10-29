
const express = require("express");
const router = express.Router();

const reviewController = require("../controller/review");
const { requireAuth } = require("../middleware/auth");

// Public: display ratings and recent reviews.
router.get("/:busId", reviewController.getReviews);

// Authentication required for all review actions.
router.post("/", requireAuth, reviewController.createReview);
router.patch("/:reviewId", requireAuth, reviewController.editReview);
router.post("/:reviewId/report", requireAuth, reviewController.reportReview);
router.post("/:reviewId/helpful", requireAuth, reviewController.markHelpful);

module.exports = router;
