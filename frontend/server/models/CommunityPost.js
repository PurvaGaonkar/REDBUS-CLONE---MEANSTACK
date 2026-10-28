const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const communityPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true, maxlength: 3000 },
    imageUrl: { type: String, default: "" },
    category: {
      type: String,
      enum: ["Routes", "Destinations", "Travel Tips", "Stories"],
      default: "Stories",
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    reports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        status: {
          type: String,
          enum: ["Pending", "Reviewed", "Dismissed"],
          default: "Pending",
        },
      },
    ],
    status: {
      type: String,
      enum: ["Published", "Hidden", "Removed"],
      default: "Published",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityPost", communityPostSchema);