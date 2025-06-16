const Deal = require('../models/deal');
const User = require('../models/User');
const Earning = require('../models/earnings');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');
const mongoose = require('mongoose');

/**
 * Comprehensive Dispute Resolution Controller
 * Handles dispute creation, escalation, mediation, and resolution workflows (Bug #21)
 * Integrates with automatic payment release system
 */

// Dispute resolution workflow statuses
const DISPUTE_STATUSES = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  MEDIATION: 'mediation',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated',
  CANCELLED: 'cancelled'
};

// Dispute categories
const DISPUTE_CATEGORIES = {
  QUALITY: 'quality_issue',
  DEADLINE: 'deadline_missed', 
  SCOPE: 'scope_disagreement',
  PAYMENT: 'payment_issue',
  COMMUNICATION: 'communication_breakdown',
  OTHER: 'other'
};

// Resolution outcomes
const RESOLUTION_OUTCOMES = {
  RELEASE_FULL: 'release_full_payment',
  RELEASE_PARTIAL: 'release_partial_payment',
  REFUND_FULL: 'refund_full_payment',
  REFUND_PARTIAL: 'refund_partial_payment',
  CONTINUE_WORK: 'continue_work',
  CANCEL_DEAL: 'cancel_deal'
};

// Create a new dispute
exports.createDispute = async (req, res) => {
  try {
    const { dealId } = req.params;
    const {
      category,
      title,
      description,
      evidence = [],
      milestoneId,
      requestedOutcome,
      urgency = 'medium'
    } = req.body;

    // Validate required fields
    if (!category || !title || !description) {
      return errorResponse(res, "Category, title, and description are required", 400);
    }

    if (!Object.values(DISPUTE_CATEGORIES).includes(category)) {
      return errorResponse(res, "Invalid dispute category", 400);
    }

    const deal = await Deal.findById(dealId)
      .populate('creatorId', 'userName email')
      .populate('marketerId', 'userName email');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check authorization
    const isCreator = deal.creatorId._id.toString() === req.user.id;
    const isMarketer = deal.marketerId._id.toString() === req.user.id;
    
    if (!isCreator && !isMarketer) {
      return errorResponse(res, "Unauthorized access to deal", 403);
    }

    // Check if deal can have disputes
    if (['cancelled', 'completed'].includes(deal.status)) {
      return errorResponse(res, "Cannot create dispute for completed or cancelled deals", 400);
    }

    // Check if milestone exists (if specified)
    let milestone = null;
    if (milestoneId) {
      milestone = deal.milestones.find(m => m._id.toString() === milestoneId);
      if (!milestone) {
        return errorResponse(res, "Milestone not found", 404);
      }
    }

    // Create dispute object
    const disputeId = new mongoose.Types.ObjectId();
    const dispute = {
      _id: disputeId,
      category,
      title,
      description,
      evidence,
      milestoneId: milestoneId || null,
      requestedOutcome,
      urgency,
      status: DISPUTE_STATUSES.PENDING,
      createdBy: req.user.id,
      createdAt: new Date(),
      disputeNumber: `D-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      
      // Timeline tracking
      timeline: [{
        action: 'dispute_created',
        timestamp: new Date(),
        userId: req.user.id,
        description: `Dispute created by ${isCreator ? 'creator' : 'marketer'}`,
        metadata: { category, urgency }
      }],
      
      // Communication thread
      messages: [],
      
      // Auto-escalation rules
      escalationRules: {
        autoEscalateAfterDays: urgency === 'high' ? 3 : urgency === 'medium' ? 7 : 14,
        escalationDate: new Date(Date.now() + (urgency === 'high' ? 3 : urgency === 'medium' ? 7 : 14) * 24 * 60 * 60 * 1000)
      },
      
      // Resolution tracking
      resolutionData: null,
      resolvedAt: null,
      resolvedBy: null
    };

    // Add dispute to deal
    if (!deal.disputes) {
      deal.disputes = [];
    }
    deal.disputes.push(dispute);

    // Update deal status to disputed
    deal.status = 'disputed';

    // Hold milestone if specified
    if (milestone) {
      milestone.disputeFlag = true;
      milestone.status = 'disputed';
    }

    deal.markModified('disputes');
    deal.markModified('milestones');
    await deal.save();

    // Notify other party
    const otherParty = isCreator ? deal.marketerId : deal.creatorId;
    await this.sendDisputeNotification(otherParty._id, deal, dispute, 'dispute_created');

    // Notify admin/support team
    await this.notifyAdminOfDispute(deal, dispute);

    return successResponse(res, "Dispute created successfully", {
      dispute: {
        id: dispute._id,
        disputeNumber: dispute.disputeNumber,
        category: dispute.category,
        title: dispute.title,
        status: dispute.status,
        urgency: dispute.urgency,
        createdAt: dispute.createdAt,
        escalationDate: dispute.escalationRules.escalationDate
      },
      deal: {
        id: deal._id,
        dealNumber: deal.dealNumber,
        status: deal.status
      },
      nextSteps: [
        "Other party will be notified",
        "Admin review will begin within 24 hours",
        "Both parties can add messages and evidence",
        `Auto-escalation in ${dispute.escalationRules.autoEscalateAfterDays} days if unresolved`
      ]
    });

  } catch (error) {
    console.error("Error creating dispute:", error);
    return handleServerError(res, error);
  }
};

// Add message to dispute
exports.addDisputeMessage = async (req, res) => {
  try {
    const { dealId, disputeId } = req.params;
    const { message, attachments = [], isAdminMessage = false } = req.body;

    if (!message || message.trim().length === 0) {
      return errorResponse(res, "Message content is required", 400);
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    const dispute = deal.disputes.find(d => d._id.toString() === disputeId);
    if (!dispute) {
      return errorResponse(res, "Dispute not found", 404);
    }

    // Check authorization
    const isCreator = deal.creatorId.toString() === req.user.id;
    const isMarketer = deal.marketerId.toString() === req.user.id;
    const isAdmin = req.user.userType === 'admin' || isAdminMessage;
    
    if (!isCreator && !isMarketer && !isAdmin) {
      return errorResponse(res, "Unauthorized access to dispute", 403);
    }

    // Add message
    const messageObj = {
      _id: new mongoose.Types.ObjectId(),
      message: message.trim(),
      attachments,
      sentBy: req.user.id,
      sentAt: new Date(),
      isAdminMessage,
      messageType: isAdmin ? 'admin' : (isCreator ? 'creator' : 'marketer')
    };

    dispute.messages.push(messageObj);

    // Add to timeline
    dispute.timeline.push({
      action: 'message_added',
      timestamp: new Date(),
      userId: req.user.id,
      description: `Message added by ${isAdmin ? 'admin' : (isCreator ? 'creator' : 'marketer')}`,
      metadata: { messageId: messageObj._id }
    });

    // Update last activity
    dispute.lastActivity = new Date();

    deal.markModified('disputes');
    await deal.save();

    // Notify other parties
    if (!isAdmin) {
      const otherParty = isCreator ? deal.marketerId : deal.creatorId;
      await this.sendDisputeNotification(otherParty, deal, dispute, 'message_added');
    } else {
      // Admin message - notify both parties
      await Promise.all([
        this.sendDisputeNotification(deal.creatorId, deal, dispute, 'admin_message_added'),
        this.sendDisputeNotification(deal.marketerId, deal, dispute, 'admin_message_added')
      ]);
    }

    return successResponse(res, "Message added to dispute successfully", {
      message: messageObj,
      dispute: {
        id: dispute._id,
        disputeNumber: dispute.disputeNumber,
        messagesCount: dispute.messages.length,
        lastActivity: dispute.lastActivity
      }
    });

  } catch (error) {
    console.error("Error adding dispute message:", error);
    return handleServerError(res, error);
  }
};

// Resolve dispute (admin/mediator action)
exports.resolveDispute = async (req, res) => {
  try {
    const { dealId, disputeId } = req.params;
    const {
      outcome,
      resolutionSummary,
      paymentActions = {},
      adminNotes
    } = req.body;

    if (!outcome || !Object.values(RESOLUTION_OUTCOMES).includes(outcome)) {
      return errorResponse(res, "Valid resolution outcome is required", 400);
    }

    if (!resolutionSummary) {
      return errorResponse(res, "Resolution summary is required", 400);
    }

    const deal = await Deal.findById(dealId)
      .populate('creatorId', 'userName email')
      .populate('marketerId', 'userName email');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    const dispute = deal.disputes.find(d => d._id.toString() === disputeId);
    if (!dispute) {
      return errorResponse(res, "Dispute not found", 404);
    }

    // Check authorization (admin only)
    if (req.user.userType !== 'admin') {
      return errorResponse(res, "Only administrators can resolve disputes", 403);
    }

    if (dispute.status === DISPUTE_STATUSES.RESOLVED) {
      return errorResponse(res, "Dispute is already resolved", 400);
    }

    // Create resolution data
    const resolutionData = {
      outcome,
      resolutionSummary,
      paymentActions,
      adminNotes,
      resolvedBy: req.user.id,
      resolvedAt: new Date(),
      resolutionMethod: 'admin_decision'
    };

    // Update dispute
    dispute.status = DISPUTE_STATUSES.RESOLVED;
    dispute.resolutionData = resolutionData;
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = req.user.id;

    // Add to timeline
    dispute.timeline.push({
      action: 'dispute_resolved',
      timestamp: new Date(),
      userId: req.user.id,
      description: `Dispute resolved: ${outcome}`,
      metadata: { outcome, resolutionMethod: 'admin_decision' }
    });

    // Execute payment actions based on resolution
    const paymentResults = await this.executeResolutionPaymentActions(deal, dispute, paymentActions);

    // Update deal status
    if (outcome === RESOLUTION_OUTCOMES.CANCEL_DEAL) {
      deal.status = 'cancelled';
      deal.cancellationReason = 'Dispute resolution';
    } else if (outcome === RESOLUTION_OUTCOMES.CONTINUE_WORK) {
      deal.status = 'active';
    } else {
      // Check if all disputes are resolved
      const unresolvedDisputes = deal.disputes.filter(d => d.status !== DISPUTE_STATUSES.RESOLVED);
      if (unresolvedDisputes.length === 0) {
        deal.status = 'active'; // Return to normal status
      }
    }

    // Clear milestone dispute flags if applicable
    if (dispute.milestoneId) {
      const milestone = deal.milestones.find(m => m._id.toString() === dispute.milestoneId);
      if (milestone) {
        milestone.disputeFlag = false;
        if (outcome === RESOLUTION_OUTCOMES.CONTINUE_WORK) {
          milestone.status = 'in_progress';
        }
      }
    }

    deal.markModified('disputes');
    deal.markModified('milestones');
    await deal.save();

    // Notify both parties
    await Promise.all([
      this.sendDisputeNotification(deal.creatorId._id, deal, dispute, 'dispute_resolved'),
      this.sendDisputeNotification(deal.marketerId._id, deal, dispute, 'dispute_resolved')
    ]);

    return successResponse(res, "Dispute resolved successfully", {
      dispute: {
        id: dispute._id,
        disputeNumber: dispute.disputeNumber,
        status: dispute.status,
        outcome: outcome,
        resolvedAt: dispute.resolvedAt
      },
      resolution: resolutionData,
      paymentResults,
      deal: {
        id: deal._id,
        status: deal.status,
        unresolvedDisputes: deal.disputes.filter(d => d.status !== DISPUTE_STATUSES.RESOLVED).length
      }
    });

  } catch (error) {
    console.error("Error resolving dispute:", error);
    return handleServerError(res, error);
  }
};

// Get dispute details
exports.getDisputeDetails = async (req, res) => {
  try {
    const { dealId, disputeId } = req.params;

    const deal = await Deal.findById(dealId)
      .populate('creatorId', 'userName email avatar')
      .populate('marketerId', 'userName email avatar');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    const dispute = deal.disputes.find(d => d._id.toString() === disputeId);
    if (!dispute) {
      return errorResponse(res, "Dispute not found", 404);
    }

    // Check authorization
    const isCreator = deal.creatorId._id.toString() === req.user.id;
    const isMarketer = deal.marketerId._id.toString() === req.user.id;
    const isAdmin = req.user.userType === 'admin';
    
    if (!isCreator && !isMarketer && !isAdmin) {
      return errorResponse(res, "Unauthorized access to dispute", 403);
    }

    // Get related milestone if applicable
    let milestone = null;
    if (dispute.milestoneId) {
      milestone = deal.milestones.find(m => m._id.toString() === dispute.milestoneId);
    }

    // Get related earnings
    const relatedEarnings = await Earning.find({
      deal: deal._id,
      ...(dispute.milestoneId && { 'metadata.milestoneId': dispute.milestoneId })
    });

    return successResponse(res, "Dispute details retrieved successfully", {
      dispute: {
        ...dispute.toObject(),
        daysOpen: Math.floor((new Date() - dispute.createdAt) / (1000 * 60 * 60 * 24)),
        daysUntilEscalation: dispute.escalationRules.escalationDate > new Date() ?
          Math.floor((dispute.escalationRules.escalationDate - new Date()) / (1000 * 60 * 60 * 24)) : 0
      },
      deal: {
        id: deal._id,
        dealNumber: deal.dealNumber,
        dealName: deal.dealName,
        status: deal.status,
        totalAmount: deal.paymentInfo?.paymentAmount
      },
      participants: {
        creator: {
          id: deal.creatorId._id,
          userName: deal.creatorId.userName,
          avatar: deal.creatorId.avatar
        },
        marketer: {
          id: deal.marketerId._id,
          userName: deal.marketerId.userName,
          avatar: deal.marketerId.avatar
        }
      },
      milestone: milestone ? {
        id: milestone._id,
        name: milestone.name,
        amount: milestone.amount,
        status: milestone.status,
        dueDate: milestone.dueDate
      } : null,
      relatedPayments: relatedEarnings.map(e => ({
        id: e._id,
        amount: e.amount,
        status: e.status,
        createdAt: e.createdAt
      })),
      permissions: {
        canAddMessages: isCreator || isMarketer || isAdmin,
        canResolve: isAdmin,
        canViewTimeline: true,
        canAddEvidence: isCreator || isMarketer
      }
    });

  } catch (error) {
    console.error("Error getting dispute details:", error);
    return handleServerError(res, error);
  }
};

// List all disputes for a user
exports.getUserDisputes = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;

    const matchQuery = {
      $or: [
        { creatorId: req.user.id },
        { marketerId: req.user.id }
      ]
    };

    // Add dispute filter
    const disputeFilters = {};
    if (status) disputeFilters['disputes.status'] = status;
    if (category) disputeFilters['disputes.category'] = category;

    const pipeline = [
      { $match: matchQuery },
      { $unwind: '$disputes' },
      { $match: disputeFilters },
      { $sort: { 'disputes.createdAt': -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'creatorId',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'marketerId',
          foreignField: '_id',
          as: 'marketer'
        }
      }
    ];

    const disputes = await Deal.aggregate(pipeline);

    return successResponse(res, "User disputes retrieved successfully", {
      disputes: disputes.map(d => ({
        disputeId: d.disputes._id,
        disputeNumber: d.disputes.disputeNumber,
        title: d.disputes.title,
        category: d.disputes.category,
        status: d.disputes.status,
        urgency: d.disputes.urgency,
        createdAt: d.disputes.createdAt,
        lastActivity: d.disputes.lastActivity,
        deal: {
          id: d._id,
          dealNumber: d.dealNumber,
          dealName: d.dealName
        },
        otherParty: d.creatorId.toString() === req.user.id ? 
          d.marketer[0]?.userName : d.creator[0]?.userName,
        messagesCount: d.disputes.messages?.length || 0,
        isResolved: d.disputes.status === DISPUTE_STATUSES.RESOLVED
      })),
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit),
        hasMore: disputes.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Error getting user disputes:", error);
    return handleServerError(res, error);
  }
};

// Helper function to execute payment actions from dispute resolution
exports.executeResolutionPaymentActions = async (deal, dispute, paymentActions) => {
  const results = {
    paymentsReleased: [],
    refundsProcessed: [],
    paymentsHeld: [],
    errors: []
  };

  try {
    // Find related earnings
    const earnings = await Earning.find({
      deal: deal._id,
      ...(dispute.milestoneId && { 'metadata.milestoneId': dispute.milestoneId })
    });

    for (const earning of earnings) {
      try {
        if (paymentActions.releasePayment && earning.status === 'escrowed') {
          // Release payment
          earning.status = 'completed';
          earning.releasedAt = new Date();
          earning.releaseType = 'dispute_resolution';
          earning.releaseReason = 'Dispute resolved in favor of creator';
          await earning.save();
          
          results.paymentsReleased.push({
            earningId: earning._id,
            amount: earning.amount
          });
        } else if (paymentActions.processRefund && earning.status === 'escrowed') {
          // Process refund (mark for refund processing)
          earning.status = 'refund_pending';
          earning.refundRequestedAt = new Date();
          earning.refundReason = 'Dispute resolved in favor of marketer';
          await earning.save();
          
          results.refundsProcessed.push({
            earningId: earning._id,
            amount: earning.amount
          });
        } else if (paymentActions.holdPayment) {
          // Keep payment in escrow
          results.paymentsHeld.push({
            earningId: earning._id,
            amount: earning.amount
          });
        }
      } catch (error) {
        results.errors.push({
          earningId: earning._id,
          error: error.message
        });
      }
    }

  } catch (error) {
    console.error('Error executing payment actions:', error);
    results.errors.push({ general: error.message });
  }

  return results;
};

// Notification helper functions
exports.sendDisputeNotification = async (userId, deal, dispute, type) => {
  try {
    let title, message;

    switch (type) {
      case 'dispute_created':
        title = '⚠️ New Dispute Created';
        message = `A dispute has been created for deal ${deal.dealNumber}: "${dispute.title}"`;
        break;
      case 'message_added':
        title = '💬 New Dispute Message';
        message = `New message added to dispute ${dispute.disputeNumber}`;
        break;
      case 'admin_message_added':
        title = '🛡️ Admin Message';
        message = `Administrator added a message to dispute ${dispute.disputeNumber}`;
        break;
      case 'dispute_resolved':
        title = '✅ Dispute Resolved';
        message = `Dispute ${dispute.disputeNumber} has been resolved: ${dispute.resolutionData?.outcome}`;
        break;
      default:
        return;
    }

    const notification = new Notification({
      userId: userId,
      type: 'dispute_update',
      title,
      message,
      data: {
        dealId: deal._id.toString(),
        disputeId: dispute._id.toString(),
        disputeNumber: dispute.disputeNumber,
        disputeStatus: dispute.status
      }
    });

    await notification.save();
  } catch (error) {
    console.error('Error sending dispute notification:', error);
  }
};

exports.notifyAdminOfDispute = async (deal, dispute) => {
  try {
    // This would typically notify admin users or create admin dashboard entries
    console.log(`🚨 New dispute requires admin attention: ${dispute.disputeNumber} for deal ${deal.dealNumber}`);
    
    // In a real implementation, you might:
    // - Send email to admin team
    // - Create admin dashboard notification
    // - Log to admin alert system
    
  } catch (error) {
    console.error('Error notifying admin of dispute:', error);
  }
};

module.exports = exports;