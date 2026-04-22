const mongoose = require("mongoose");

const qrScanSchema = new mongoose.Schema(
  {
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
      index: true,
    },
    petName: {
      type: String,
      required: true,
      trim: true,
    },
    scannedBy: {
      type: String,
      trim: true,
      default: "",
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "",
    },
    userAgent: {
      type: String,
      trim: true,
      default: "",
    },
    geolocation: {
      type: {
        latitude: {
          type: Number,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180,
        },
        accuracy: {
          type: Number,
          min: 0,
        },
        timestamp: {
          type: Date,
        },
      },
      default: null,
    },
    deviceInfo: {
      type: String,
      trim: true,
      default: "",
    },
    isLost: {
      type: Boolean,
      default: false,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    scannedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
qrScanSchema.index({ pet: 1, scannedAt: -1 });
qrScanSchema.index({ pet: 1, isLost: 1 });
qrScanSchema.index({ createdAt: -1 });

const QRScan = mongoose.model("QRScan", qrScanSchema);

module.exports = QRScan;
