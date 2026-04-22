const mongoose = require("mongoose");

const healthEventSchema = new mongoose.Schema(
  {
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
      index: true,
    },
    adopter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        "vaccination",
        "checkup",
        "medication",
        "vaccination_booster",
        "flea_treatment",
        "dental_cleaning",
        "surgery",
        "vaccination_rabies",
        "vaccination_dhpp",
        "vaccination_other",
        "other",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    completedDate: {
      type: Date,
      default: null,
      index: true,
    },
    veterinarian: {
      name: {
        type: String,
        trim: true,
        default: "",
      },
      clinic: {
        type: String,
        trim: true,
        default: "",
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
    },
    cost: {
      type: Number,
      min: 0,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
    colorCode: {
      type: String,
      enum: ["blue", "green", "amber", "red", "purple"],
      default: "blue",
    },
    attachments: {
      type: [String],
      validate: {
        validator(value) {
          return value.length <= 5;
        },
        message: "A health event can have at most 5 attachments",
      },
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for common queries
healthEventSchema.index({ pet: 1, adopter: 1, isCompleted: 1 });
healthEventSchema.index({ pet: 1, scheduledDate: 1 });
healthEventSchema.index({ adopter: 1, scheduledDate: 1 });

const HealthEvent = mongoose.model("HealthEvent", healthEventSchema);

module.exports = HealthEvent;
