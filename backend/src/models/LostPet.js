const mongoose = require("mongoose");

const lostPetSchema = new mongoose.Schema(
  {
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
      index: true,
    },
    adoption: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["lost", "found", "returned"],
      default: "lost",
      index: true,
    },
    reportedDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    lastSeenLocation: {
      address: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          validate: {
            validator(value) {
              return (
                Array.isArray(value) &&
                value.length === 2 &&
                value[0] >= -180 &&
                value[0] <= 180 &&
                value[1] >= -90 &&
                value[1] <= 90
              );
            },
            message: "Invalid GeoJSON coordinates",
          },
        },
      },
    },
    lastSeenDate: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    photos: {
      type: [String],
      validate: {
        validator(value) {
          return value.length <= 5;
        },
        message: "Can upload at most 5 photos",
      },
      default: [],
    },
    contactInfo: {
      phone: {
        type: String,
        trim: true,
        maxlength: 20,
        default: "",
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },
    },
    reward: {
      amount: {
        type: Number,
        min: 0,
        default: 0,
      },
      currency: {
        type: String,
        enum: ["USD", "EUR", "GBP", "CAD"],
        default: "USD",
      },
    },
    foundDate: {
      type: Date,
      default: null,
    },
    foundLocation: {
      address: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          validate: {
            validator(value) {
              return (
                Array.isArray(value) &&
                value.length === 2 &&
                value[0] >= -180 &&
                value[0] <= 180 &&
                value[1] >= -90 &&
                value[1] <= 90
              );
            },
            message: "Invalid GeoJSON coordinates",
          },
        },
      },
    },
    foundBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// GeoJSON index for location queries
lostPetSchema.index({ "lastSeenLocation.coordinates": "2dsphere" });
lostPetSchema.index({ "foundLocation.coordinates": "2dsphere" });
lostPetSchema.index({ owner: 1, status: 1 });
lostPetSchema.index({ reportedDate: -1 });

const LostPet = mongoose.model("LostPet", lostPetSchema);

module.exports = LostPet;
