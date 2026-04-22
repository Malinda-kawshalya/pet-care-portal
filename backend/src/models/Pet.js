const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      index: true,
    },
    species: {
      type: String,
      required: true,
      enum: ["dog", "cat", "rabbit", "bird", "other"],
      index: true,
    },
    breed: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female"],
      index: true,
    },
    weight: {
      type: Number,
      min: 0,
      default: null,
    },
    colour: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    photos: {
      type: [String],
      validate: {
        validator(value) {
          return value.length <= 10;
        },
        message: "A pet can have at most 10 photos",
      },
      default: [],
    },
    video: {
      type: String,
      trim: true,
      default: "",
    },
    healthStatus: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    isVaccinated: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending_approval", "available", "reserved", "adopted", "removed"],
      default: "available",
      index: true,
    },
    listingType: {
      type: String,
      enum: ["adoption", "profile"],
      default: "adoption",
      index: true,
    },
    qrCodeUrl: {
      type: String,
      trim: true,
      default: "",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

petSchema.index({ name: "text", breed: "text", species: "text" });
petSchema.index({ addedBy: 1, listingType: 1, status: 1 });

const Pet = mongoose.model("Pet", petSchema);

module.exports = Pet;
