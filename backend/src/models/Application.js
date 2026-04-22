const mongoose = require("mongoose");

const adminNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      trim: true,
      maxlength: 2000,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["received", "under_review", "interview_scheduled", "reserved", "adopted", "rejected"],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
      index: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["received", "under_review", "interview_scheduled", "reserved", "adopted", "rejected"],
      default: "received",
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 100,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100,
      required: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },
    physicalAddress: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    homeType: {
      type: String,
      enum: ["apartment", "house", "farm", "other"],
      required: true,
    },
    hasOutdoorSpace: {
      type: Boolean,
      required: true,
    },
    timeAtHome: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    isFirstTimeOwner: {
      type: Boolean,
      default: false,
    },
    hasOtherPets: {
      type: Boolean,
      default: false,
    },
    otherPets: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    workSchedule: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    priorExperience: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    reasonForAdoption: {
      type: String,
      trim: true,
      maxlength: 1000,
      required: true,
    },
    additionalNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    agreedToTerms: {
      type: Boolean,
      required: true,
      validate: {
        validator(value) {
          return value === true;
        },
        message: "You must agree to the adoption terms",
      },
    },
    adminNotes: {
      type: [adminNoteSchema],
      default: [],
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ pet: 1, applicant: 1, status: 1 });
applicationSchema.index({ applicant: 1, createdAt: -1 });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ pet: 1, createdAt: -1 });

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
