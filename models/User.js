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
  // Profile completion tracking
  profileCompletion: {
    score: { type: Number, default: 0, min: 0, max: 100 },
    completedSteps: [{ type: String }], // Array of completed step IDs
    requiredFields: {
      basic: {
        completed: { type: Boolean, default: false },
        fields: {
          name: { type: Boolean, default: false },
          email: { type: Boolean, default: false },
          phone: { type: Boolean, default: false },
          bio: { type: Boolean, default: false },
          avatar: { type: Boolean, default: false }
        }
      },
      roleSpecific: {
        completed: { type: Boolean, default: false },
        fields: { type: Schema.Types.Mixed, default: {} }
      },
      verification: {
        completed: { type: Boolean, default: false },
        fields: {
          emailVerified: { type: Boolean, default: false },
          phoneVerified: { type: Boolean, default: false }
        }
      },
      financial: {
        completed: { type: Boolean, default: false },
        fields: {
          stripeConnected: { type: Boolean, default: false },
          paymentMethodAdded: { type: Boolean, default: false }
        }
      },
      preferences: {
        completed: { type: Boolean, default: false },
        fields: {
          settingsConfigured: { type: Boolean, default: false },
          categoriesSelected: { type: Boolean, default: false }
        }
      }
    },
    lastCalculated: { type: Date, default: Date.now },
    notifications: {
      enabled: { type: Boolean, default: true },
      lastSent: { type: Date },
      frequency: { type: String, enum: ["daily", "weekly", "never"], default: "weekly" }
    }
  },
  
  // QR Code data for profile sharing
  qrCodeData: {
    lastGenerated: { type: Date },
    purpose: { 
      type: String, 
      enum: ["profile", "connect", "contact"],
      default: "profile"
    },
    expiresAt: { type: Date },
    token: { type: String, select: false }, // Not returned by default for security
    usageCount: { type: Number, default: 0 }
  },
  
  // Ghost account fields
  accountType: { 
    type: String, 
    enum: ['full', 'ghost'], 
    default: 'full' 
  },
  isGhostAccount: { 
    type: Boolean, 
    default: false 
  },
  ghostAccountData: {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdVia: { type: String, enum: ['qr_code', 'direct_invite', 'other'] },
    qrCodeId: String,
    temporaryPassword: { type: String, select: false }, // Hidden by default for security
    expiresAt: Date,
    convertedAt: Date,
    originalOffer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletionReason: { type: String },
});

// Profile completion calculation method
userSchema.methods.calculateProfileCompletion = function() {
  const completion = this.profileCompletion || {};
  const requiredFields = completion.requiredFields || {};
  
  // Initialize if not exists
  if (!this.profileCompletion) {
    this.profileCompletion = {
      score: 0,
      completedSteps: [],
      requiredFields: {
        basic: { completed: false, fields: {} },
        roleSpecific: { completed: false, fields: {} },
        verification: { completed: false, fields: {} },
        financial: { completed: false, fields: {} },
        preferences: { completed: false, fields: {} }
      },
      lastCalculated: new Date(),
      notifications: {
        enabled: true,
        frequency: "weekly"
      }
    };
  }

  let totalScore = 0;
  const weights = {
    basic: 30,
    roleSpecific: 25,
    verification: 20,
    financial: 15,
    preferences: 10
  };

  // Basic information (30 points)
  const basicFields = {
    name: !!this.name,
    email: !!this.email,
    phone: !!this.phone,
    bio: !!this.bio,
    avatar: !!this.avatarUrl
  };
  
  const basicCompleted = Object.values(basicFields).filter(Boolean).length;
  const basicScore = (basicCompleted / Object.keys(basicFields).length) * weights.basic;
  totalScore += basicScore;
  
  this.profileCompletion.requiredFields.basic = {
    completed: basicCompleted === Object.keys(basicFields).length,
    fields: basicFields
  };

  // Role-specific information (25 points)
  let roleSpecificScore = 0;
  let roleSpecificFields = {};
  
  if (this.userType === 'Creator') {
    const creatorData = this.creatorData || {};
    roleSpecificFields = {
      handleName: !!creatorData.handleName,
      categories: !!(creatorData.categories && creatorData.categories.length > 0),
      platforms: !!(creatorData.platforms && creatorData.platforms.length > 0),
      portfolio: !!(creatorData.portfolio && creatorData.portfolio.length > 0),
      rates: !!(creatorData.rates && creatorData.rates.sponsoredPostRate)
    };
  } else if (this.userType === 'Marketer') {
    const marketerData = this.marketerData || {};
    roleSpecificFields = {
      brandName: !!marketerData.brandName,
      brandWebsite: !!marketerData.brandWebsite,
      industry: !!marketerData.industry,
      brandDescription: !!marketerData.brandDescription,
      budget: !!marketerData.budget
    };
  }
  
  const roleSpecificCompleted = Object.values(roleSpecificFields).filter(Boolean).length;
  if (Object.keys(roleSpecificFields).length > 0) {
    roleSpecificScore = (roleSpecificCompleted / Object.keys(roleSpecificFields).length) * weights.roleSpecific;
  }
  totalScore += roleSpecificScore;
  
  this.profileCompletion.requiredFields.roleSpecific = {
    completed: roleSpecificCompleted === Object.keys(roleSpecificFields).length,
    fields: roleSpecificFields
  };

  // Verification (20 points)
  const verificationFields = {
    emailVerified: !!this.emailVerified,
    phoneVerified: !!this.phone // Assuming phone presence means verified for now
  };
  
  const verificationCompleted = Object.values(verificationFields).filter(Boolean).length;
  const verificationScore = (verificationCompleted / Object.keys(verificationFields).length) * weights.verification;
  totalScore += verificationScore;
  
  this.profileCompletion.requiredFields.verification = {
    completed: verificationCompleted === Object.keys(verificationFields).length,
    fields: verificationFields
  };

  // Financial setup (15 points)
  const financialFields = {
    stripeConnected: !!this.stripeConnectId,
    paymentMethodAdded: !!(this.paymentMethods && this.paymentMethods.length > 0)
  };
  
  const financialCompleted = Object.values(financialFields).filter(Boolean).length;
  const financialScore = (financialCompleted / Object.keys(financialFields).length) * weights.financial;
  totalScore += financialScore;
  
  this.profileCompletion.requiredFields.financial = {
    completed: financialCompleted === Object.keys(financialFields).length,
    fields: financialFields
  };

  // Preferences (10 points)
  const preferencesFields = {
    settingsConfigured: !!(this.settings && (
      this.settings.notifications || this.settings.privacy
    )),
    categoriesSelected: !!(
      (this.creatorData && this.creatorData.categories && this.creatorData.categories.length > 0) ||
      (this.marketerData && this.marketerData.categories && this.marketerData.categories.length > 0)
    )
  };
  
  const preferencesCompleted = Object.values(preferencesFields).filter(Boolean).length;
  const preferencesScore = (preferencesCompleted / Object.keys(preferencesFields).length) * weights.preferences;
  totalScore += preferencesScore;
  
  this.profileCompletion.requiredFields.preferences = {
    completed: preferencesCompleted === Object.keys(preferencesFields).length,
    fields: preferencesFields
  };

  // Update score and timestamp
  this.profileCompletion.score = Math.round(totalScore);
  this.profileCompletion.lastCalculated = new Date();
  
  return this.profileCompletion.score;
};

userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  
  // Calculate profile completion if any relevant fields changed
  const profileRelevantFields = [
    'name', 'email', 'phone', 'bio', 'avatarUrl', 'emailVerified',
    'stripeConnectId', 'paymentMethods', 'settings', 'creatorData', 'marketerData'
  ];
  
  const hasProfileChanges = profileRelevantFields.some(field => this.isModified(field));
  
  if (hasProfileChanges || !this.profileCompletion) {
    this.calculateProfileCompletion();
  }
  
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
console.log('🔍 User model: Added indexes for better query performance');

module.exports = mongoose.model("User", userSchema);
