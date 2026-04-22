const mongoose = require("mongoose");

const communityMessageSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    room: {
      type: String,
      default: "main",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

communityMessageSchema.index({ room: 1, createdAt: 1 });

const CommunityMessage = mongoose.model("CommunityMessage", communityMessageSchema);

module.exports = CommunityMessage;