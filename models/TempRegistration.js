const mongoose = require("mongoose");

const tempRegistrationSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  userType: {
    type: String,
    required: true,
    enum: ["Creator", "Marketer"],
  },
  otpCode: {
    type: String,
    required: false,
  },
  otpExpiresAt: {
    type: Date,
    required: true,
  },
  otpSentAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 10, // Document will be automatically deleted after 1 hour
  },
  verificationId: {
    type: Number,

  }
});

module.exports = mongoose.model("TempRegistration", tempRegistrationSchema);
