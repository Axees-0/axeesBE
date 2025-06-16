// models/Notification.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,

      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
    },
    unread: {
      type: Boolean,
      default: true,
    },
    data: {
      targetScreen: String,
      offerId: String,
      amount: String,
      postDate: String,
      offerName: String,
      dealNumber: String,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

notificationSchema.statics.markAsRead = async function (
  userId,
  notificationId
) {
  await this.updateOne(
    { _id: notificationId, user: userId },
    { $set: { unread: false, readAt: new Date() } }
  );
};

notificationSchema.statics.markAllAsRead = async function (userId) {
  await this.updateMany(
    { user: userId, unread: true },
    { $set: { unread: false, readAt: new Date() } }
  );
};

module.exports = mongoose.model("Notification", notificationSchema);
