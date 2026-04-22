const mongoose = require("mongoose");
const { ALL_ROLES, USER_ROLES } = require("../constants/roles");

const notificationChannelSchema = new mongoose.Schema(
  {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
  },
  { _id: false }
);

const notificationPrefsSchema = new mongoose.Schema(
  {
    channels: {
      type: notificationChannelSchema,
      default: () => ({ inApp: true, email: true }),
    },
    types: {
      registration: { type: notificationChannelSchema, default: () => ({ inApp: true, email: true }) },
      passwordReset: { type: notificationChannelSchema, default: () => ({ inApp: true, email: true }) },
      applicationStatus: { type: notificationChannelSchema, default: () => ({ inApp: true, email: true }) },
      healthReminder: { type: notificationChannelSchema, default: () => ({ inApp: true, email: true }) },
      qrScanEvent: { type: notificationChannelSchema, default: () => ({ inApp: true, email: true }) },
      community: { type: notificationChannelSchema, default: () => ({ inApp: true, email: false }) },
      chatAssistant: { type: notificationChannelSchema, default: () => ({ inApp: true, email: false }) },
      security: { type: notificationChannelSchema, default: () => ({ inApp: true, email: true }) },
      system: { type: notificationChannelSchema, default: () => ({ inApp: true, email: true }) },
    },
    // Legacy support for older persisted preference shape.
    registration: { type: Boolean, default: undefined },
    passwordReset: { type: Boolean, default: undefined },
    applicationStatus: { type: Boolean, default: undefined },
    healthReminder: { type: Boolean, default: undefined },
    qrScanEvent: { type: Boolean, default: undefined },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: USER_ROLES.USER,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: null,
      index: true,
    },
    notificationPrefs: {
      type: notificationPrefsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
