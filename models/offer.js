const mongoose = require("mongoose");
const { Schema } = mongoose;

const counterSchema = new Schema({
  counterBy: { type: String, enum: ["Marketer", "Creator"], required: true },
  counterAmount: { type: Number },
  notes: { type: String },
  counterReviewDate: { type: Date },
  counterPostDate: { type: Date },
  counterDate: { type: Date, default: Date.now },
  deliverables: [{ type: String }],
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  expiresAt: { type: Date },
  isMessage: { type: Boolean, default: false },
  isAcceptance: { type: Boolean, default: false },
  isRejection: { type: Boolean, default: false },
  isInternal: { type: Boolean, default: false },
  acceptedTerms: {
    amount: Number,
    reviewDate: Date,
    postDate: Date,
    deliverables: [String]
  },
  attachments: [{
    fileUrl: String,
    fileType: String,
    fileName: String
  }]
});

const offerSchema = new Schema({
  marketerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User", // Must match the exact model name in mongoose.model("User", userSchema)
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User", // Must match the exact model name in mongoose.model("User", userSchema)
  },
  offerType: {
    type: String,
    enum: ["standard", "trial", "premium"],
    default: "standard",
  },
  // Trial offer specific fields
  trialDetails: {
    isTrialOffer: { type: Boolean, default: false },
    trialAmount: { type: Number, default: 1 }, // $1 trial
    trialDuration: { type: Number, default: 7 }, // days
    fullAmount: { type: Number }, // Amount after trial
    autoConvertDate: { type: Date }, // When trial converts to full payment
    trialStatus: {
      type: String,
      enum: ["pending", "active", "converted", "cancelled", "expired"],
      default: "pending"
    },
    trialStartDate: { type: Date },
    trialEndDate: { type: Date },
    conversionDate: { type: Date },
    paymentIntentId: { type: String }, // Stripe payment intent for trial
    subscriptionId: { type: String }, // Stripe subscription ID if applicable
    remindersSent: [{
      type: { type: String }, // "trial_ending", "conversion_upcoming", "trial_expired"
      sentAt: { type: Date },
      messageId: { type: String }
    }]
  },
  offerName: { type: String, required: true },
  description: { type: String },
  platforms: [{ type: String }],
  deliverables: [{ type: String }],
  desiredReviewDate: { type: Date },
  desiredPostDate: { type: Date },
  attachments: [
    {
      fileUrl: String,
      fileType: String,
    },
  ],
  proposedAmount: { type: Number },
  currency: { type: String, default: "USD" },
  startDate: { type: Date },
  endDate: { type: Date },
  status: {
    type: String,
  },
  counters: [counterSchema],
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  creatorDraft: {
    amount: Number,
    notes: String,
    reviewDate: Date,
    postDate: Date,
    lastUpdated: Date,
    status: String,
  },
  marketerDraft: {
    amount: Number,
    notes: String,
    reviewDate: Date,
    postDate: Date,
    lastUpdated: Date,
    status: String,
  },
  viewedByCreator: { type: Boolean, default: false },
  viewedByCreatorAt: { type: Date },
  viewedByMarketer: { type: Boolean, default: false },
  viewedByMarketerAt: { type: Date },
  editHistory: [{
    timestamp: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userRole: { type: String, enum: ["marketer", "creator"], required: true },
    changes: [{
      field: { type: String, required: true },
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed
    }],
    version: { type: Number, required: true }
  }],
  comments: [{
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userRole: { type: String, enum: ["marketer", "creator"], required: true },
    comment: { type: String, required: true, maxLength: 500 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    isEdited: { type: Boolean, default: false },
    editHistory: [{
      editedAt: { type: Date, default: Date.now },
      previousComment: { type: String, required: true }
    }]
  }],
  currentEditors: [{
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    sessionId: String,
    lastActivity: { type: Date, default: Date.now }
  }],
  collaborationSettings: {
    allowSimultaneousEditing: { type: Boolean, default: true },
    notifyOnChanges: { type: Boolean, default: true },
    autoSaveInterval: { type: Number, default: 30000 } // 30 seconds
  },
  negotiationMetrics: {
    totalRounds: { type: Number, default: 0 },
    negotiationStarted: { type: Date },
    lastActivity: { type: Date },
    convergenceScore: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // in hours
    participantEngagement: {
      marketerResponses: { type: Number, default: 0 },
      creatorResponses: { type: Number, default: 0 }
    }
  },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  tags: [{ type: String }],
  externalReferences: [{
    type: { type: String }, // e.g., "calendar_event", "deal", "contract"
    id: { type: String },
    url: { type: String }
  }]
});

offerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  
  // Update negotiation metrics if counters were modified
  if (this.isModified('counters')) {
    // Update total rounds
    this.negotiationMetrics.totalRounds = this.counters.length;
    
    // Set negotiation start time if first counter
    if (this.counters.length === 1 && !this.negotiationMetrics.negotiationStarted) {
      this.negotiationMetrics.negotiationStarted = this.counters[0].counterDate || new Date();
    }
    
    // Update last activity
    if (this.counters.length > 0) {
      const lastCounter = this.counters[this.counters.length - 1];
      this.negotiationMetrics.lastActivity = lastCounter.counterDate || new Date();
    }
    
    // Update participant engagement counts
    const marketerCounters = this.counters.filter(c => c.counterBy === 'Marketer').length;
    const creatorCounters = this.counters.filter(c => c.counterBy === 'Creator').length;
    
    this.negotiationMetrics.participantEngagement.marketerResponses = marketerCounters;
    this.negotiationMetrics.participantEngagement.creatorResponses = creatorCounters;
    
    // Calculate average response time if we have enough data
    if (this.counters.length >= 2) {
      let totalTime = 0;
      let responseCount = 0;
      
      for (let i = 1; i < this.counters.length; i++) {
        const prevCounter = this.counters[i - 1];
        const currentCounter = this.counters[i];
        
        if (prevCounter.counterDate && currentCounter.counterDate) {
          const timeDiff = (new Date(currentCounter.counterDate) - new Date(prevCounter.counterDate)) / (1000 * 60 * 60); // hours
          totalTime += timeDiff;
          responseCount++;
        }
      }
      
      if (responseCount > 0) {
        this.negotiationMetrics.averageResponseTime = Math.round(totalTime / responseCount * 10) / 10;
      }
    }
  }
  
  next();
});

module.exports = mongoose.model("Offer", offerSchema);
