/* ────────────────────────────────────────────────────────────────
   QR CODE MODEL – Axees
   QR code generation and tracking
   ───────────────────────────────────────────────────────────── */
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Scan tracking sub-schema
 */
const ScanSchema = new Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // User info (if logged in)
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  
  // Ghost account (if not logged in)
  ghostAccountId: String,
  
  // Device/browser info
  userAgent: String,
  ipAddress: String,
  
  // Location (if available)
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    country: String
  },
  
  // Additional metadata
  referrer: String,
  metadata: Schema.Types.Mixed
});

/**
 * QR Code Schema
 */
const QRCodeSchema = new Schema({
  // Unique QR code identifier
  qrCodeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // QR code type and target
  type: {
    type: String,
    required: true,
    enum: ['profile', 'offer', 'deal', 'event', 'campaign', 'custom'],
    index: true
  },
  
  targetId: {
    type: String,
    required: true,
    index: true
  },
  
  // Owner of the QR code
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // URLs
  shortUrl: {
    type: String,
    required: true,
    unique: true
  },
  
  trackingUrl: {
    type: String,
    required: true
  },
  
  // QR code generation options
  options: {
    size: {
      type: Number,
      default: 300
    },
    color: {
      type: String,
      default: '#000000'
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF'
    },
    format: {
      type: String,
      enum: ['png', 'svg', 'base64'],
      default: 'base64'
    },
    hasLogo: {
      type: Boolean,
      default: false
    },
    errorCorrectionLevel: {
      type: String,
      enum: ['L', 'M', 'Q', 'H'],
      default: 'H'
    }
  },
  
  // Scan tracking
  scans: [ScanSchema],
  
  scanCount: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Unique users/devices that scanned
  uniqueUsers: [{
    type: String // Can be userId, ghostAccountId, or IP
  }],
  
  // Analytics
  lastScannedAt: Date,
  
  // Campaign/marketing info
  campaign: {
    campaignId: String,
    campaignName: String,
    tags: [String],
    budget: Number,
    startDate: Date,
    endDate: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'expired', 'deleted'],
    default: 'active',
    index: true
  },
  
  // Expiration
  expiresAt: Date,
  
  // Custom metadata
  metadata: {
    title: String,
    description: String,
    customData: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
QRCodeSchema.index({ userId: 1, type: 1, createdAt: -1 });
QRCodeSchema.index({ type: 1, scanCount: -1 });
QRCodeSchema.index({ 'campaign.campaignId': 1 });
QRCodeSchema.index({ status: 1, expiresAt: 1 });

// Virtual for unique scan count
QRCodeSchema.virtual('uniqueScanCount').get(function() {
  return this.uniqueUsers.length;
});

// Virtual for conversion rate (if applicable)
QRCodeSchema.virtual('conversionRate').get(function() {
  if (this.scanCount === 0) return 0;
  // This would need to be calculated based on actual conversions
  // For now, return null to indicate it needs implementation
  return null;
});

// Virtual for checking if expired
QRCodeSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

// Pre-save middleware to update status
QRCodeSchema.pre('save', function(next) {
  // Update status based on expiration
  if (this.isExpired && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Static method to get popular QR codes
QRCodeSchema.statics.getPopular = async function(type, limit = 10) {
  return this.find({
    type,
    status: 'active'
  })
  .sort({ scanCount: -1 })
  .limit(limit)
  .populate('userId', 'name email');
};

// Static method to get analytics by type
QRCodeSchema.statics.getTypeAnalytics = async function(userId, startDate, endDate) {
  const matchStage = { userId: mongoose.Types.ObjectId(userId) };
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalScans: { $sum: '$scanCount' },
        avgScans: { $avg: '$scanCount' },
        lastScanned: { $max: '$lastScannedAt' }
      }
    },
    {
      $project: {
        type: '$_id',
        _id: 0,
        count: 1,
        totalScans: 1,
        avgScans: { $round: ['$avgScans', 2] },
        lastScanned: 1
      }
    },
    { $sort: { totalScans: -1 } }
  ]);
};

// Instance method to add scan
QRCodeSchema.methods.addScan = function(scanData) {
  this.scans.push(scanData);
  this.scanCount += 1;
  this.lastScannedAt = new Date();
  
  // Track unique user
  const identifier = scanData.userId || scanData.ghostAccountId || scanData.ipAddress;
  if (identifier && !this.uniqueUsers.includes(identifier)) {
    this.uniqueUsers.push(identifier);
  }
  
  return this.save();
};

// Instance method to pause/unpause
QRCodeSchema.methods.toggleStatus = function() {
  if (this.status === 'active') {
    this.status = 'paused';
  } else if (this.status === 'paused') {
    this.status = 'active';
  }
  return this.save();
};

// Instance method to get scan analytics
QRCodeSchema.methods.getScanAnalytics = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const recentScans = this.scans.filter(scan => scan.timestamp >= startDate);
  
  // Group by day
  const scansByDay = {};
  recentScans.forEach(scan => {
    const day = scan.timestamp.toISOString().split('T')[0];
    scansByDay[day] = (scansByDay[day] || 0) + 1;
  });
  
  // Device type analysis
  const deviceTypes = recentScans.reduce((acc, scan) => {
    const ua = (scan.userAgent || '').toLowerCase();
    let device = 'unknown';
    if (ua.includes('mobile')) device = 'mobile';
    else if (ua.includes('tablet')) device = 'tablet';
    else if (ua.includes('desktop')) device = 'desktop';
    
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalScans: recentScans.length,
    uniqueScans: new Set(recentScans.map(s => s.userId || s.ghostAccountId || s.ipAddress)).size,
    scansByDay,
    deviceTypes,
    avgScansPerDay: (recentScans.length / days).toFixed(2)
  };
};

module.exports = mongoose.model('QRCode', QRCodeSchema);