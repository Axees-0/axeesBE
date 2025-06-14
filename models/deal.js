const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  bonus: {
    type: Number,
    default: 0,
    required: false,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  deliverables: { type: Array, default: [] }, // Add this default
  description: String,
  status: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fundedAt: Date,
  completedAt: Date,
  transactionId: String,
  feedback: [
    {
      id: mongoose.Schema.Types.ObjectId,
      feedback: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
});

const proofSubmissionSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  attachments: [
    {
      type: { type: String, required: true },
      url: String,
      content: String,
      originalName: String,
      submittedAt: { type: Date, default: Date.now },
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending_review", "approved", "revision_required"],
    default: "pending_review",
  },
  feedback: [
    {
      id: mongoose.Schema.Types.ObjectId,
      feedback: String,
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
  approvedAt: Date,
});

const contentSubmissionSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  deliverables: [
    {
      type: String, // 'file' or 'text'
      url: String, // for files
      content: String, // for text
      originalName: String, // for files
      submittedAt: Date,
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending_review", "approved", "revision_required"],
    default: "pending_review",
  },
  feedback: [
    {
      id: mongoose.Schema.Types.ObjectId,
      feedback: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
});

const dealSchema = new mongoose.Schema(
  {
    marketerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },
    dealName: {
      type: String,
      required: true,
    },
    dealNumber: {
      type: String,
      required: true,
      unique: true,
    },
    transactionNumber: String,
    platforms: [String],
    deliverables: [String],
    desiredReviewDate: Date,
    desiredPostDate: Date,
    paymentInfo: {
      currency: {
        type: String,
        default: "USD",
      },
      paymentStatus: {
        type: String,
        enum: ["Pending", "Partial", "Paid"],
        default: "Pending",
      },
      paymentAmount: {
        type: Number,
        required: true,
      },
      paymentNeeded: {
        type: Boolean,
        default: true,
      },
      requiredPayment: {
        type: Number,
        default: 0,
        min: 0,
      },
      transactions: [
        {
          paymentAmount: Number,
          paymentMethod: String,
          transactionId: String,
          type: {
            type: String,
            enum: [
              "escrow",
              "release_half",
              "refund",
              "release_final",
              "milestone",
            ],
            required: true,
          },
          status: {
            type: String,
          },
          paidAt: Date,
          milestoneId: mongoose.Schema.Types.ObjectId,
        },
      ],
    },
    status: {
      type: String,
    },
    cancellationReason: String,
    proofSubmissions: [proofSubmissionSchema],
    contentSubmissions: [contentSubmissionSchema],
    milestones: [milestoneSchema],
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
        uploadedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add any necessary indexes
dealSchema.index({ marketerId: 1, status: 1 });
dealSchema.index({ creatorId: 1, status: 1 });
dealSchema.index({ dealNumber: 1 }, { unique: true });

module.exports = mongoose.model("Deal", dealSchema);
