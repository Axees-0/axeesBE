const mongoose = require("mongoose");
const { Schema } = mongoose;

const payoutSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    stripeTransactionId: { type: String }, // optional: the Stripe charge or payment intent ID
    deal: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "REFUNDED", "ESCROW"],
      default: "PENDING",
    },
    requestedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payout", payoutSchema);


