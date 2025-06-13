const mongoose = require("mongoose");

const DraftSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
    required: false,
  },
  amount: Number,
  notes: String,
  reviewDate: Date,
  postDate: Date,
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  draftType: {
    type: String,
  },
  status: {
    type: String,
    default: "Draft",
  },
  attachments: [
    {
      fileUrl: String,
      fileType: String,
    },
  ],
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  deliverables: [String],
  description: String,
  offerType: {
    type: String,
  },
  offerName: String,
});

module.exports = mongoose.model("Draft", DraftSchema);
