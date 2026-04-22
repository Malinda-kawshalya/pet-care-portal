const mongoose = require("mongoose");

const volunteerApplicationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    areaOfInterest: {
      type: String,
      required: true,
      enum: ["shelter-care", "foster-parent", "event-support"],
    },
    availability: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected"],
      default: "pending_review",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

volunteerApplicationSchema.index({ email: 1, createdAt: -1 });
volunteerApplicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("VolunteerApplication", volunteerApplicationSchema);
