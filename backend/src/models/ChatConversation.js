const mongoose = require("mongoose");

const chatConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Chat",
      trim: true,
      maxlength: 120,
    },
    lastMessage: {
      type: String,
      default: "",
      maxlength: 500,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

chatConversationSchema.index({ user: 1, updatedAt: -1 });

const ChatConversation = mongoose.model("ChatConversation", chatConversationSchema);

module.exports = ChatConversation;
