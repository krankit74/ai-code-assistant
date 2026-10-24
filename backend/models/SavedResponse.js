const mongoose = require("mongoose");

const savedResponseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "Saved AI Response",
      trim: true,
      maxlength: 150,
    },

    type: {
      type: String,
      enum: ["Explain", "Debug", "Optimize"],
      required: true,
    },

    language: {
      type: String,
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    response: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SavedResponse", savedResponseSchema);
