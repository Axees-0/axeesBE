const mongoose = require('mongoose');

const { Schema, Types } = mongoose;

/** Mini‑schema used for the `lastMessage` snapshot inside a room */
const LastMessageSchema = new Schema(
  {
    _id: Types.ObjectId,                // original message id
    senderId: { type: Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    attachments: [
      {
        url: { type: String, required: true },
        type: { type: String, required: true }, // e.g. image, pdf, …
        name: String,
        size: Number,
      },
    ],
    createdAt: Date,
  },
  { _id: false }
);

/** Chat room with exactly two participants */
const ChatRoomSchema = new Schema(
  {
    participants: {
      type: [{ type: Types.ObjectId, ref: 'User', required: true }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 2,
        message: 'A chat room must contain exactly 2 participants.',
      },
    },

    /** Offer that spawned this room (nullable) */
    createdFromOffer: { type: Types.ObjectId, ref: 'Offer' },

    /** Map<userId, unreadCount> */
    unreadCount: {
      type: Map,
      of: { type: Number, default: 0 },
      default: {},
    },

    /** Cached copy of the most recent message for fast list rendering */
    lastMessage: LastMessageSchema,

    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'chatRooms' }
);

/* ------------------------------------------------------------------ */
/*                            Indexes                                 */
/* ------------------------------------------------------------------ */

/**
 * Ensure that only one 1‑to‑1 room exists for any pair of users.
 *   - participants array is sorted alphabetically before save,
 *     so [A, B] and [B, A] hash to the same unique key.
 *   - sparse keeps other indexes (e.g. group chats) unaffected if added later.
 */
ChatRoomSchema.index(
  { participants: 1, createdFromOffer: 1 },
  { 
    unique: true,
    name: "participants_offer_unique"  // Keep this consistent
  }
);


/* ------------------------------------------------------------------ */
/*                            Hooks                                   */
/* ------------------------------------------------------------------ */

/** Sort the two participant IDs so the unique index works irrespective of order */
ChatRoomSchema.pre('save', function (next) {
  if (this.isModified('participants') && this.participants?.length === 2) {
    this.participants.sort(); // lexicographic sort of ObjectId strings
  }
  next();
});




  

  module.exports = mongoose.model('ChatRoom', ChatRoomSchema);
