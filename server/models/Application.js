const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "waitlisted", "withdrawn", "rejected", "hired"],
      default: "waitlisted",
    },
    waitlistPosition: {
      type: Number,
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    promotedAt: {
      type: Date,
      default: null,
    },
    decayCount: {
      type: Number,
      default: 0,
    },
    logs: [logSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);