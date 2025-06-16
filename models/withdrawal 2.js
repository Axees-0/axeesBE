const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the User model
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String, // E.g., 'Bank Transfer', 'Stripe', etc.
      required: true,
    },
    transactionId: {
      type: String,
      required: true, // Unique transaction ID for the withdrawal
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed","refund"],
      default: "pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    failureReason: {
      type: String, // Optional, stores reason if the withdrawal failed
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create an index for better querying
withdrawalSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
