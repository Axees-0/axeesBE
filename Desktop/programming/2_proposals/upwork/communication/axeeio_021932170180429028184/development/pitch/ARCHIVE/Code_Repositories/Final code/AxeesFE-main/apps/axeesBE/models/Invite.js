// models/Invite.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const inviteSchema = new Schema({
  inviter: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  inviteeName: {
    type: String,
    required: true,
  },
  inviteeEmail: {
    type: String,
    required: true,
  },
  inviteToken: {
    type: String,
    unique: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "cancelled", "expired"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Invite", inviteSchema);
