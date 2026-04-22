const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    eventType: {
      type: String,
      enum: ["meetup", "workshop", "adoption_drive", "awareness", "other"],
      default: "other",
      index: true,
    },
    startsAt: {
      type: Date,
      required: true,
      index: true,
    },
    endsAt: {
      type: Date,
      default: null,
    },
    approvalStatus: {
      type: String,
      enum: ["pending_approval", "approved", "rejected"],
      default: "pending_approval",
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ approvalStatus: 1, startsAt: 1 });
eventSchema.index({ createdBy: 1, createdAt: -1 });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
