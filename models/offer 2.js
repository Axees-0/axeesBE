const mongoose = require("mongoose");
const { Schema } = mongoose;

const counterSchema = new Schema({
  counterBy: { type: String, enum: ["Marketer", "Creator"], required: true },
  counterAmount: { type: Number },
  notes: { type: String },
  counterReviewDate: { type: Date },
  counterPostDate: { type: Date },
});

const offerSchema = new Schema({
  marketerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User", // Must match the exact model name in mongoose.model("User", userSchema)
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User", // Must match the exact model name in mongoose.model("User", userSchema)
  },
  offerType: {
    type: String,
    default: "standard",
  },
  offerName: { type: String, required: true },
  description: { type: String },
<<<<<<< HEAD
=======
  platforms: [{ type: String }],
>>>>>>> feature/testing-infrastructure
  deliverables: [{ type: String }],
  desiredReviewDate: { type: Date },
  desiredPostDate: { type: Date },
  attachments: [
    {
      fileUrl: String,
      fileType: String,
    },
  ],
  proposedAmount: { type: Number },
  currency: { type: String, default: "USD" },
  startDate: { type: Date },
  endDate: { type: Date },
  status: {
    type: String,
  },
  counters: [counterSchema],
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  creatorDraft: {
    amount: Number,
    notes: String,
    reviewDate: Date,
    postDate: Date,
    lastUpdated: Date,
    status: String,
  },
  marketerDraft: {
    amount: Number,
    notes: String,
    reviewDate: Date,
    postDate: Date,
    lastUpdated: Date,
    status: String,
  },
  viewedByCreator: { type: Boolean, default: false },
  viewedByCreatorAt: { type: Date },
  viewedByMarketer: { type: Boolean, default: false },
  viewedByMarketerAt: { type: Date },
});

offerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Offer", offerSchema);
