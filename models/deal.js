const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true,
    maxlength: [100, 'Milestone name cannot exceed 100 characters']
  },
  label: {
    type: String,
    enum: ['Initial Payment', 'Progress Payment', 'Completion Payment', 'Final Payment'],
    required: true
  },
  order: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be positive']
  },
  percentage: {
    type: Number,
    required: true,
    min: [0, 'Percentage must be between 0 and 100'],
    max: [100, 'Percentage must be between 0 and 100']
  },
  bonus: {
    type: Number,
    default: 0,
    min: [0, 'Bonus must be positive']
  },
  dueDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  deliverables: { 
    type: [String], 
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 10;
      },
      message: 'Maximum 10 deliverables allowed per milestone'
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'funded', 'in_progress', 'submitted', 'approved', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fundedAt: Date,
  completedAt: Date,
  approvedAt: Date,
  transactionId: String,
  paymentIntentId: String, // Stripe payment intent
  releaseScheduled: {
    type: Boolean,
    default: false
  },
  autoReleaseDate: Date, // Automatic release date
  disputeFlag: {
    type: Boolean,
    default: false
  },
  visualConfig: {
    color: {
      type: String,
      default: '#430B92'
    },
    icon: {
      type: String,
      default: 'milestone'
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  feedback: [
    {
      id: mongoose.Schema.Types.ObjectId,
      feedback: String,
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
});

const proofSubmissionSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  attachments: [
    {
      type: { type: String, required: true },
      url: String,
      content: String,
      originalName: String,
      submittedAt: { type: Date, default: Date.now },
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending_review", "approved", "revision_required"],
    default: "pending_review",
  },
  feedback: [
    {
      id: mongoose.Schema.Types.ObjectId,
      feedback: String,
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
  approvedAt: Date,
});

const contentSubmissionSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  deliverables: [
    {
      type: String, // 'file' or 'text'
      url: String, // for files
      content: String, // for text
      originalName: String, // for files
      submittedAt: Date,
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending_review", "approved", "revision_required"],
    default: "pending_review",
  },
  feedback: [
    {
      id: mongoose.Schema.Types.ObjectId,
      feedback: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
});

const dealSchema = new mongoose.Schema(
  {
    marketerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },
    dealName: {
      type: String,
      required: true,
    },
    dealNumber: {
      type: String,
      required: true,
      unique: true,
    },
    transactionNumber: String,
    platforms: [String],
    deliverables: [String],
    desiredReviewDate: Date,
    desiredPostDate: Date,
    paymentInfo: {
      currency: {
        type: String,
        default: "USD",
      },
      paymentStatus: {
        type: String,
        enum: ["Pending", "Partial", "Paid", "Escrowed", "Released"],
        default: "Pending",
      },
      paymentAmount: {
        type: Number,
        required: true,
      },
      paymentNeeded: {
        type: Boolean,
        default: true,
      },
      requiredPayment: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalEscrowed: {
        type: Number,
        default: 0
      },
      totalReleased: {
        type: Number,
        default: 0
      },
      milestoneBreakdown: {
        enabled: {
          type: Boolean,
          default: true
        },
        totalMilestones: {
          type: Number,
          default: 0,
          max: [4, 'Maximum 4 milestones allowed']
        },
        completedMilestones: {
          type: Number,
          default: 0
        },
        percentageValidation: {
          type: Boolean,
          default: true
        }
      },
      automaticRelease: {
        enabled: {
          type: Boolean,
          default: true
        },
        defaultDays: {
          type: Number,
          default: 7,
          min: 1,
          max: 30
        },
        conditions: [{
          type: {
            type: String,
            enum: ['time_based', 'milestone_completion', 'approval_timeout']
          },
          value: mongoose.Schema.Types.Mixed,
          active: {
            type: Boolean,
            default: true
          }
        }]
      },
      transactions: [
        {
          paymentAmount: Number,
          paymentMethod: String,
          transactionId: String,
          paymentIntentId: String,
          type: {
            type: String,
            enum: [
              "escrow",
              "release_half",
              "refund",
              "release_final",
              "milestone",
              "auto_release",
              "dispute_resolution"
            ],
            required: true,
          },
          status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
            default: 'pending'
          },
          paidAt: Date,
          releasedAt: Date,
          milestoneId: mongoose.Schema.Types.ObjectId,
          isAutomatic: {
            type: Boolean,
            default: false
          },
          metadata: mongoose.Schema.Types.Mixed
        },
      ],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'disputed', 'on_hold'],
      default: 'active'
    },
    cancellationReason: String,
    proofSubmissions: [proofSubmissionSchema],
    contentSubmissions: [contentSubmissionSchema],
    milestones: {
      type: [milestoneSchema],
      validate: {
        validator: function(milestones) {
          return milestones.length <= 4;
        },
        message: 'Maximum 4 milestones allowed per deal'
      }
    },
    milestoneTemplate: {
      type: String,
      enum: ['equal_split', 'front_loaded', 'back_loaded', 'custom'],
      default: 'equal_split'
    },
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
        uploadedAt: Date,
      },
    ],
    // QR Code data for deal tracking
    qrCodeData: {
      lastGenerated: { type: Date },
      generatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      },
      token: { type: String, select: false }, // Security token, not returned by default
      scanCount: { type: Number, default: 0 },
      lastScanned: { type: Date }
    },
    
    // Dispute resolution system for deal conflicts (Bug #21)
    disputes: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      },
      disputeNumber: {
        type: String,
        required: true,
        unique: true
      },
      category: {
        type: String,
        enum: ['quality_issue', 'deadline_missed', 'scope_disagreement', 'payment_issue', 'communication_breakdown', 'other'],
        required: true
      },
      title: {
        type: String,
        required: true,
        maxlength: 100
      },
      description: {
        type: String,
        required: true,
        maxlength: 1000
      },
      evidence: [{
        type: {
          type: String,
          enum: ['file', 'link', 'text'],
          required: true
        },
        url: String,
        content: String,
        description: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }],
      milestoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Milestone'
      },
      requestedOutcome: {
        type: String,
        enum: ['release_full_payment', 'release_partial_payment', 'refund_full_payment', 'refund_partial_payment', 'continue_work', 'cancel_deal']
      },
      urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      status: {
        type: String,
        enum: ['pending', 'under_review', 'mediation', 'resolved', 'escalated', 'cancelled'],
        default: 'pending'
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      lastActivity: {
        type: Date,
        default: Date.now
      },
      
      // Timeline tracking
      timeline: [{
        action: {
          type: String,
          enum: ['dispute_created', 'message_added', 'evidence_added', 'status_changed', 'dispute_resolved', 'escalated'],
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        description: {
          type: String,
          required: true
        },
        metadata: mongoose.Schema.Types.Mixed
      }],
      
      // Communication thread
      messages: [{
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId()
        },
        message: {
          type: String,
          required: true,
          maxlength: 2000
        },
        attachments: [{
          type: {
            type: String,
            enum: ['file', 'image', 'document'],
            required: true
          },
          url: {
            type: String,
            required: true
          },
          name: String,
          size: Number
        }],
        sentBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        sentAt: {
          type: Date,
          default: Date.now
        },
        isAdminMessage: {
          type: Boolean,
          default: false
        },
        messageType: {
          type: String,
          enum: ['creator', 'marketer', 'admin'],
          required: true
        }
      }],
      
      // Auto-escalation rules
      escalationRules: {
        autoEscalateAfterDays: {
          type: Number,
          default: 7,
          min: 1,
          max: 30
        },
        escalationDate: Date,
        escalated: {
          type: Boolean,
          default: false
        },
        escalatedAt: Date,
        escalatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      },
      
      // Resolution tracking
      resolutionData: {
        outcome: {
          type: String,
          enum: ['release_full_payment', 'release_partial_payment', 'refund_full_payment', 'refund_partial_payment', 'continue_work', 'cancel_deal']
        },
        resolutionSummary: {
          type: String,
          maxlength: 2000
        },
        paymentActions: mongoose.Schema.Types.Mixed,
        adminNotes: {
          type: String,
          maxlength: 1000
        },
        resolvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        resolvedAt: Date,
        resolutionMethod: {
          type: String,
          enum: ['admin_decision', 'mutual_agreement', 'automatic_escalation'],
          default: 'admin_decision'
        }
      },
      
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
  },
  {
    timestamps: true,
  }
);

// Milestone validation middleware
dealSchema.pre('save', function(next) {
  if (this.milestones && this.milestones.length > 0) {
    // Validate milestone count
    if (this.milestones.length > 4) {
      return next(new Error('Maximum 4 milestones allowed per deal'));
    }
    
    // Validate percentage total equals 100%
    const totalPercentage = this.milestones.reduce((sum, milestone) => sum + milestone.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) { // Allow for small rounding errors
      return next(new Error(`Milestone percentages must total 100%. Current total: ${totalPercentage.toFixed(2)}%`));
    }
    
    // Validate milestone amounts match percentages
    const totalAmount = this.paymentInfo.paymentAmount;
    for (let milestone of this.milestones) {
      const expectedAmount = Math.round((milestone.percentage / 100) * totalAmount * 100) / 100; // Round to 2 decimals
      if (Math.abs(milestone.amount - expectedAmount) > 0.01) {
        return next(new Error(`Milestone "${milestone.name}" amount (${milestone.amount}) doesn't match percentage (${milestone.percentage}%). Expected: ${expectedAmount}`));
      }
    }
    
    // Validate milestone order and ensure no duplicates
    const orders = this.milestones.map(m => m.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        return next(new Error('Milestone orders must be sequential starting from 1'));
      }
    }
    
    // Validate due dates are in order
    const sortedMilestones = [...this.milestones].sort((a, b) => a.order - b.order);
    for (let i = 1; i < sortedMilestones.length; i++) {
      if (new Date(sortedMilestones[i].dueDate) <= new Date(sortedMilestones[i-1].dueDate)) {
        return next(new Error('Milestone due dates must be in chronological order'));
      }
    }
    
    // Update milestone breakdown info
    this.paymentInfo.milestoneBreakdown.totalMilestones = this.milestones.length;
    this.paymentInfo.milestoneBreakdown.completedMilestones = this.milestones.filter(m => m.status === 'completed').length;
  }
  
  next();
});

// Helper method to get milestone templates
dealSchema.statics.getMilestoneTemplates = function() {
  return {
    equal_split: {
      name: 'Equal Split',
      description: 'Split payment equally across all milestones',
      milestones: [
        { label: 'Initial Payment', percentage: 25, order: 1 },
        { label: 'Progress Payment', percentage: 25, order: 2 },
        { label: 'Completion Payment', percentage: 25, order: 3 },
        { label: 'Final Payment', percentage: 25, order: 4 }
      ]
    },
    front_loaded: {
      name: 'Front Loaded',
      description: 'Higher payments early in the project',
      milestones: [
        { label: 'Initial Payment', percentage: 40, order: 1 },
        { label: 'Progress Payment', percentage: 30, order: 2 },
        { label: 'Completion Payment', percentage: 20, order: 3 },
        { label: 'Final Payment', percentage: 10, order: 4 }
      ]
    },
    back_loaded: {
      name: 'Back Loaded',
      description: 'Higher payments towards project completion',
      milestones: [
        { label: 'Initial Payment', percentage: 10, order: 1 },
        { label: 'Progress Payment', percentage: 20, order: 2 },
        { label: 'Completion Payment', percentage: 30, order: 3 },
        { label: 'Final Payment', percentage: 40, order: 4 }
      ]
    },
    custom: {
      name: 'Custom',
      description: 'Define your own milestone percentages',
      milestones: [] // User defines
    }
  };
};

// Helper method to generate visual milestone representation
dealSchema.methods.getMilestoneVisualization = function() {
  const milestones = this.milestones.sort((a, b) => a.order - b.order);
  
  return milestones.map((milestone, index) => {
    const colors = ['#430B92', '#6B46C1', '#8B5CF6', '#A78BFA'];
    const icons = ['💰', '⚡', '🎯', '🏆'];
    
    return {
      id: milestone._id || milestone.id,
      order: milestone.order,
      name: milestone.name,
      label: milestone.label,
      amount: milestone.amount,
      percentage: milestone.percentage,
      status: milestone.status,
      dueDate: milestone.dueDate,
      visual: {
        color: colors[index] || '#430B92',
        icon: icons[index] || '📋',
        progressPercentage: milestone.visualConfig?.progressPercentage || 0,
        isActive: ['funded', 'in_progress', 'submitted'].includes(milestone.status),
        isCompleted: milestone.status === 'completed',
        isPending: milestone.status === 'pending'
      },
      timeline: {
        createdAt: milestone.createdAt,
        fundedAt: milestone.fundedAt,
        completedAt: milestone.completedAt,
        daysUntilDue: Math.ceil((new Date(milestone.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      }
    };
  });
};

// Add any necessary indexes
dealSchema.index({ marketerId: 1, status: 1 });
dealSchema.index({ creatorId: 1, status: 1 });
dealSchema.index({ dealNumber: 1 }, { unique: true });
dealSchema.index({ 'milestones.status': 1 });
dealSchema.index({ 'milestones.dueDate': 1 });
dealSchema.index({ 'paymentInfo.automaticRelease.enabled': 1, 'milestones.autoReleaseDate': 1 });
// Dispute resolution indexes (Bug #21)
dealSchema.index({ 'disputes.status': 1 });
dealSchema.index({ 'disputes.createdBy': 1, 'disputes.status': 1 });
dealSchema.index({ 'disputes.category': 1 });
dealSchema.index({ 'disputes.escalationRules.escalationDate': 1 });
dealSchema.index({ 'disputes.disputeNumber': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Deal", dealSchema);
