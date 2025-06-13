// models/earnings.js
const mongoose = require("mongoose");

const earningSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
  amount: { type: Number, required: true },
  paymentMethod: { type: String },
  transactionId: { type: String },
  reference: { type: String }, // new custom field
  image: { type: String },     // new custom field (e.g., depositing account image)
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'escrowed', 'released'],
    default: 'completed'
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Earning", earningSchema);
