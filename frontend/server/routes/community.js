const express = require("express");
const mongoose = require("mongoose");
const CommunityPost = require("../models/CommunityPost");

const router = express.Router();

// Connect these to your existing authentication middleware.
const { requireAuth, requireAdmin } = require("../middleware/auth");

function verifiedUser(req, res, next) {
  if (!req.user || req.user.isVerified !== true) {
    return res.status(403).json({
      message: "Verify your account before posting or interacting.",
    });
  }

  next();
}

// Public community feed
router.get("/posts", async (req, res) => {
  try {
    const posts = await CommunityPost.find({ status: "Published" })
      .populate("author", "name profileImage isVerified")
      .populate("comments.user", "name profileImage")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch {
    res.status(500).json({ message: "Unable to load posts." });
  }
});

// Create post — verified users only
router.post("/posts", requireAuth, verifiedUser, async (req, res) => {
  try {
    const { content, imageUrl, category } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Post content is required." });
    }

    const post = await CommunityPost.create({
      author: req.user._id,
      content: content.trim(),
      imageUrl: imageUrl || "",
      category: category || "Stories",
    });

    await post.populate("author", "name profileImage isVerified");
    res.status(201).json(post);
  } catch {
    res.status(500).json({ message: "Unable to create post." });
  }
});

// Like or unlike
router.post("/posts/:id/like", requireAuth, verifiedUser, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID." });
    }

    const post = await CommunityPost.findOne({
      _id: req.params.id,
      status: "Published",
    });

    if (!post) return res.status(404).json({ message: "Post not found." });

    const userId = req.user._id.toString();
    const liked = post.likes.some((id) => id.toString() === userId);

    if (liked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.addToSet(req.user._id);
    }

    await post.save();
    res.json({ liked: !liked, likesCount: post.likes.length });
  } catch {
    res.status(500).json({ message: "Unable to update like." });
  }
});

// Comment on a post
router.post(
  "/posts/:id/comments",
  requireAuth,
  verifiedUser,
  async (req, res) => {
    try {
      const text = req.body.text?.trim();

      if (!text || text.length > 1000) {
        return res.status(400).json({ message: "Enter a valid comment." });
      }

      const post = await CommunityPost.findOne({
        _id: req.params.id,
        status: "Published",
      });

      if (!post) return res.status(404).json({ message: "Post not found." });

      post.comments.push({ user: req.user._id, text });
      await post.save();
      await post.populate("comments.user", "name profileImage");

      res.status(201).json(post.comments[post.comments.length - 1]);
    } catch {
      res.status(500).json({ message: "Unable to add comment." });
    }
  }
);

// Report inappropriate content
router.post("/posts/:id/report", requireAuth, async (req, res) => {
  try {
    const reason = req.body.reason?.trim();

    if (!reason || reason.length > 500) {
      return res.status(400).json({ message: "Enter a report reason." });
    }

    const post = await CommunityPost.findOne({
      _id: req.params.id,
      status: "Published",
    });

    if (!post) return res.status(404).json({ message: "Post not found." });

    const alreadyReported = post.reports.some(
      (report) => report.user?.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return res.status(409).json({ message: "Already reported." });
    }

    post.reports.push({ user: req.user._id, reason });
    await post.save();

    res.status(201).json({ message: "Report submitted for review." });
  } catch {
    res.status(500).json({ message: "Unable to submit report." });
  }
});

// Admin: review reports
router.get("/admin/reports", requireAuth, requireAdmin, async (req, res) => {
  const posts = await CommunityPost.find({
    "reports.status": "Pending",
  }).populate("author", "name");

  res.json(posts);
});

// Admin: hide or remove content
router.patch(
  "/admin/posts/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { status } = req.body;

    if (!["Published", "Hidden", "Removed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const post = await CommunityPost.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!post) return res.status(404).json({ message: "Post not found." });

    res.json(post);
  }
);

module.exports = router;