/* ────────────────────────────────────────────────────────────────
   GHOST ACCOUNT MODEL – Axees
   Temporary/guest accounts for users who haven't registered yet
   ───────────────────────────────────────────────────────────── */
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Activity tracking sub-schema
 */
const ActivitySchema = new Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'account_created',
      'qr_scan',
      'page_view',
      'offer_viewed',
      'deal_viewed',
      'creator_viewed',
      'share_clicked',
      'conversion_started',
      'converted_to_user',
      'expired'
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  }
});

/**
 * Ghost Account Schema
 */
const GhostAccountSchema = new Schema({
  // Unique identifier for ghost account
  ghostId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Optional email (for pre-registration)
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true // Allow null but ensure uniqueness when present
  },
  
  // Display name
  name: {
    type: String,
    default: 'Guest User'
  },
  
  // How the ghost account was created
  source: {
    type: String,
    required: true,
    enum: ['qr_code', 'direct_link', 'social_share', 'email_invite', 'other'],
    default: 'direct_link'
  },
  
  // Tracking and analytics
  metadata: {
    // Source details
    qrCodeId: String,
    inviteId: String,
    referrerId: String,
    campaignId: String,
    
    // Device/browser info
    userAgent: String,
    ipAddress: String,
    
    // Location (if provided)
    location: {
      latitude: Number,
      longitude: Number,
      city: String,
      country: String
    },
    
    // Additional custom data
    customData: Schema.Types.Mixed
  },
  
  // Activity tracking
  activities: [ActivitySchema],
  
  // Conversion tracking
  convertedToUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  
  convertedAt: Date,
  
  // Expiration
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: true
  },
  
  // Timestamps
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
GhostAccountSchema.index({ source: 1, createdAt: -1 });
GhostAccountSchema.index({ convertedToUserId: 1 });
GhostAccountSchema.index({ 'metadata.qrCodeId': 1 });
GhostAccountSchema.index({ 'metadata.campaignId': 1 });

// Virtual for checking if expired
GhostAccountSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for checking if converted
GhostAccountSchema.virtual('isConverted').get(function() {
  return !!this.convertedToUserId;
});

// Virtual for activity count
GhostAccountSchema.virtual('activityCount').get(function() {
  return this.activities.length;
});

// Pre-save middleware to update lastActivityAt
GhostAccountSchema.pre('save', function(next) {
  if (this.isModified('activities')) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Static method to clean up expired accounts
GhostAccountSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
    convertedToUserId: { $exists: false }
  });
  return result.deletedCount;
};

// Static method to get analytics
GhostAccountSchema.statics.getAnalytics = async function(startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        converted: {
          $sum: { $cond: [{ $ifNull: ['$convertedToUserId', false] }, 1, 0] }
        },
        bySource: {
          $push: {
            source: '$source',
            converted: { $cond: [{ $ifNull: ['$convertedToUserId', false] }, 1, 0] }
          }
        },
        avgActivitiesPerAccount: { $avg: { $size: '$activities' } }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        converted: 1,
        conversionRate: {
          $multiply: [{ $divide: ['$converted', '$total'] }, 100]
        },
        bySource: 1,
        avgActivitiesPerAccount: { $round: ['$avgActivitiesPerAccount', 2] }
      }
    }
  ]);
};

// Instance method to add activity
GhostAccountSchema.methods.addActivity = function(action, details = {}) {
  this.activities.push({
    action,
    timestamp: new Date(),
    details
  });
  return this.save();
};

module.exports = mongoose.model('GhostAccount', GhostAccountSchema);