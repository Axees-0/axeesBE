// models/User.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Sub-schema for a single social handle with platform, handle, and follower count
 */
const SocialHandleSchema = new Schema({
  platform: {
      type: String,
      enum: ['instagram', 'youtube', 'facebook', 'tiktok', 'twitter', 'x', 'twitch'],
      required: true,
      lowercase: true,  // Mongoose option: auto lowercases before save
    },
  handle: { type: String },
  followersCount: { type: Number, default: 0 },
});

/**
 * For a single portfolio item
 */
const PortfolioItemSchema = new Schema({
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ["image", "video", "pdf", "other"] },
  title: { type: String },
  description: { type: String },
});

/* sanitize phone like TempUser */
const cleanPhone = p =>
  /^\+?\d{6,15}$/.test((p||'').trim()) ? p.trim() : undefined;

/**
 * Creator-specific data
 */
const CreatorDataSchema = new Schema({
  handleName: { type: String },
  nicheTopics: [{ type: String }],

  // For your front-end "categories" container
  categories: [{ type: String }],

  // "platforms" sub-doc array
  platforms: [SocialHandleSchema],

  // We unify "stats" style fields here
  totalFollowers: { type: Number, default: 0 },
  listedEvents: { type: Number, default: 0 }, // For UI if needed
  combinedViews: { type: Number, default: 0 },
  offers: { type: Number, default: 0 },
  deals: { type: Number, default: 0 },
  funFact: { type: String },

  // Possibly additional "profileViews" if your UI needs it
  profileViews: { type: Number, default: 0 },

  portfolio: [PortfolioItemSchema],
  mediaPackageUrl: { type: String },
  // Achievements & Business Ventures
  achievements: { type: String },
  businessVentures: { type: String },
  mostViewedTitle: { type: String },
  // Future expansions (e.g. rates, sponsorship details)
  rates: {
    sponsoredPostRate: { type: Number },
  },
});

/**
 * Marketer-specific data
 */
const MarketerDataSchema = new Schema({
  brandName: { type: String },
  brandWebsite: { type: String },
  handleName: { type: String },
  platforms: [SocialHandleSchema],
  portfolio: [PortfolioItemSchema],
  categories: [{ type: String }],

  // We unify "stats" style fields here
  totalFollowers: { type: Number, default: 0 },
  listedEvents: { type: Number, default: 0 }, // For UI if needed
  combinedViews: { type: Number, default: 0 },
  offers: { type: Number, default: 0 },
  deals: { type: Number, default: 0 },
  nicheTopics: [{ type: String }],
  brandDescription: { type: String },
  industry: { type: String },
  mediaPackageUrl: { type: String },
  budget: { type: Number }, // default budget?

  // If your front-end references offers, deals in a similar way:
  offers: { type: Number, default: 0 },
  deals: { type: Number, default: 0 },

  // or keep the old fields
  offersCount: { type: Number, default: 0 },
  dealsCompleted: { type: Number, default: 0 },
});

/**
 * For user notification / privacy settings
 */
const UserSettingsSchema = new Schema({
  notifications: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
  },
  privacy: {
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
  },
});

const userSchema = new Schema({
  phone: { type: String, trim:true },
  email: { type: String },
  password: { type: String },
  verificationId: {
    type: Number,
  },
  name: { type: String },
  userName: { type: String },
  bio: { type: String },
  link: { type: String },
  tags: [{ type: String }],
  avatarUrl: { type: String },

  stripeCustomerId: { type: String, default: null },
  stripeConnectId: { type: String, default: null },
  paymentMethods: [{
    id           : { type:String, required:true }, // pm_ / ba_ / card_
    isBankAccount: { type:Boolean, default:false },
    isPayoutCard : { type:Boolean, default:false }, // << NEW
    addedAt      : { type:Date,    default:Date.now },
  }],

  userType: {
    type: String,
    enum: ["Marketer", "Creator"],
    required: true,
  },
  isActive: { type: Boolean, default: false },
  mainPlatform: { type: String },
  brandName: { type: String },
  buythis: { type: String },
  // Sub-docs
  creatorData: CreatorDataSchema,
  marketerData: MarketerDataSchema,

  // Settings
  settings: { type: UserSettingsSchema, default: () => ({}) },

  // OTP / Nudges / device token
  otpCode: { type: String },
  otpExpiresAt: { type: Date },
  otpSentAt: { type: Date },
  reminderDeadlines: {
    profileDeadline: { type: Date },
    passwordDeadline: { type: Date },
    emailDeadline: { type: Date },
  },
  deviceToken: { type: String },
/**  creators that this user bookmarked (stores their _id's) */
 favorites     : [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // soft delete or status
  status: {
    type: String,
    default: "active",
    enum: ["active", "deleted", "banned", "deactivated"],
  },
  deletedAt: { type: Date },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletionReason: { type: String },
});

userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

/* and register the hook afterwards */
userSchema.pre('validate', function(next){
  this.phone = cleanPhone(this.phone);
  next();
});

// Create indexes for frequently queried fields to improve performance
userSchema.index({ status: 1, userType: 1 }); // Combined index for most common query filters
userSchema.index({ 'creatorData.categories': 1 }); // Index on categories for filtering
userSchema.index({ 'creatorData.totalFollowers': -1 }); // Index for "popular" sorting
userSchema.index({ userName: 1 }); // For looking up by username
userSchema.index({ name: 1 }); // For text searches
userSchema.index({ _id: 1, status: 1, userType: 1 }); // For cursor-based pagination with filters
// models/User.js
userSchema.index({
  name: 'text',
  userName: 'text',
  bio: 'text',
  tags: 'text',
  'creatorData.categories': 'text',
  'creatorData.nicheTopics': 'text',
  'creatorData.handleName': 'text',
}, { name: 'user_fulltext' });


// Explain index usage
<<<<<<< HEAD
console.log('🔍 User model: Added indexes for better query performance');
=======
// User model: Added indexes for better query performance
>>>>>>> feature/testing-infrastructure

module.exports = mongoose.model("User", userSchema);
