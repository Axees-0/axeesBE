const mongoose = require('mongoose');

const { Schema, Types } = mongoose;

const AttachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, required: true }, // mime category or custom enum
    name: String,
    size: Number, // bytes
  },
  { _id: false }
);

const MessageSchema = new Schema(
  {
    chatId: {
      type: Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
      index: true,
    },

    senderId: { type: Types.ObjectId, ref: 'User', required: true },

    text: { type: String, default: '' }, // can be empty if only attachments

    attachments: { type: [AttachmentSchema], default: [] },

    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },

    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { collection: 'messages' }
);

/* ------------------------------------------------------------------ */
/*                            Indexes                                 */
/* ------------------------------------------------------------------ */

/** Reverse‑chronological paging within a room */
MessageSchema.index({ chatId: 1, createdAt: -1 });

/* ------------------------------------------------------------------ */
/*                            Hooks                                   */
/* ------------------------------------------------------------------ */

MessageSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Message', MessageSchema);