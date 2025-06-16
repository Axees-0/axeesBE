const Deal = require('../models/deal');
const User = require('../models/User');
const Earning = require('../models/earnings');
const Payout = require('../models/payouts');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');
const mongoose = require('mongoose');

/**
 * Comprehensive Automatic Payment Release Controller
 * Handles automatic release of escrowed payments based on various triggers:
 * - Time-based releases (deal completion + grace period)
 * - Milestone-based releases (completed deliverables)
 * - Dispute resolution releases
 * - Emergency releases (admin intervention)
 */

// Configure automatic release rules
const RELEASE_RULES = {
  STANDARD_DEAL: {
    gracePeriodDays: 7, // Days after deal completion before auto-release
    maxEscrowDays: 30, // Maximum days to hold in escrow
    requiresApproval: false
  },
  MILESTONE_DEAL: {
    gracePeriodDays: 3, // Shorter grace period for milestone deals
    maxEscrowDays: 14, // Shorter max escrow for milestones
    requiresApproval: false
  },
  HIGH_VALUE_DEAL: {
    threshold: 5000, // Deals over $5000
    gracePeriodDays: 14, // Longer grace period for high-value deals
    maxEscrowDays: 45,
    requiresApproval: true // May require manual approval
  },
  DISPUTE_RESOLUTION: {
    gracePeriodDays: 1, // Quick release after dispute resolution
    maxEscrowDays: 60, // Extended escrow during disputes
    requiresApproval: true
  }
};

// Helper function to determine release rules for a deal
const getReleaseRules = (deal) => {
  const totalAmount = deal.paymentInfo?.paymentAmount || 0;
  
  if (deal.status === 'disputed') {
    return RELEASE_RULES.DISPUTE_RESOLUTION;
  } else if (totalAmount > RELEASE_RULES.HIGH_VALUE_DEAL.threshold) {
    return RELEASE_RULES.HIGH_VALUE_DEAL;
  } else if (deal.milestones && deal.milestones.length > 0) {
    return RELEASE_RULES.MILESTONE_DEAL;
  } else {
    return RELEASE_RULES.STANDARD_DEAL;
  }
};

// Calculate release date based on deal completion and rules
const calculateReleaseDate = (deal, rules) => {
  const completionDate = deal.completedAt || new Date();
  const releaseDate = new Date(completionDate);
  releaseDate.setDate(releaseDate.getDate() + rules.gracePeriodDays);
  return releaseDate;
};

// Check if payment is eligible for automatic release
exports.checkReleaseEligibility = async (req, res) => {
  try {
    const { dealId } = req.params;

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

    // Get release rules for this deal
    const rules = getReleaseRules(deal);
    
    // Find escrowed earnings for this deal
    const escrowedEarnings = await Earning.find({
      deal: deal._id,
      status: 'escrowed'
    });

    if (escrowedEarnings.length === 0) {
      return successResponse(res, "No escrowed payments found for this deal", {
        deal: {
          id: deal._id,
          dealNumber: deal.dealNumber,
          status: deal.status
        },
        eligibility: {
          hasEscrowedFunds: false,
          autoReleaseEnabled: false,
          message: "No payments are currently held in escrow"
        }
      });
    }

    // Calculate release eligibility for each earning
    const eligibilityDetails = escrowedEarnings.map(earning => {
      const escrowDate = earning.createdAt;
      const currentDate = new Date();
      const daysSinceEscrowed = Math.floor((currentDate - escrowDate) / (1000 * 60 * 60 * 24));
      
      let releaseDate;
      let isEligible = false;
      let reason = '';

      if (deal.status === 'completed') {
        releaseDate = calculateReleaseDate(deal, rules);
        isEligible = currentDate >= releaseDate;
        reason = isEligible ? 'Deal completed and grace period passed' : 
                `Grace period active until ${releaseDate.toISOString()}`;
      } else if (daysSinceEscrowed >= rules.maxEscrowDays) {
        isEligible = true;
        reason = 'Maximum escrow period exceeded';
        releaseDate = new Date(escrowDate.getTime() + (rules.maxEscrowDays * 24 * 60 * 60 * 1000));
      } else if (earning.metadata?.milestoneId) {
        // Check milestone-specific eligibility
        const milestone = deal.milestones?.find(m => 
          m._id.toString() === earning.metadata.milestoneId
        );
        if (milestone && milestone.status === 'completed') {
          isEligible = true;
          reason = 'Milestone completed';
          releaseDate = milestone.completedAt;
        } else {
          reason = 'Waiting for milestone completion';
        }
      } else {
        reason = 'Deal not yet completed';
      }

      return {
        earningId: earning._id,
        amount: earning.amount,
        escrowedAt: earning.createdAt,
        daysSinceEscrowed,
        isEligible,
        releaseDate,
        reason,
        milestoneId: earning.metadata?.milestoneId
      };
    });

    const totalEscrowed = escrowedEarnings.reduce((sum, e) => sum + e.amount, 0);
    const eligibleAmount = eligibilityDetails
      .filter(e => e.isEligible)
      .reduce((sum, e) => sum + e.amount, 0);

    return successResponse(res, "Release eligibility checked successfully", {
      deal: {
        id: deal._id,
        dealNumber: deal.dealNumber,
        dealName: deal.dealName,
        status: deal.status,
        completedAt: deal.completedAt,
        totalAmount: deal.paymentInfo?.paymentAmount
      },
      escrow: {
        totalEscrowed,
        eligibleForRelease: eligibleAmount,
        pendingRelease: totalEscrowed - eligibleAmount,
        earningsCount: escrowedEarnings.length
      },
      rules: {
        gracePeriodDays: rules.gracePeriodDays,
        maxEscrowDays: rules.maxEscrowDays,
        requiresApproval: rules.requiresApproval,
        dealType: totalEscrowed > RELEASE_RULES.HIGH_VALUE_DEAL.threshold ? 'high_value' : 'standard'
      },
      eligibilityDetails,
      permissions: {
        canTriggerRelease: isMarketer || isCreator,
        canViewDetails: true,
        canScheduleRelease: isMarketer
      }
    });

  } catch (error) {
    console.error("Error checking release eligibility:", error);
    return handleServerError(res, error);
  }
};

// Trigger automatic release for eligible payments
exports.triggerAutomaticRelease = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { 
      earningIds = [],
      releaseType = 'manual',
      reason,
      forceRelease = false 
    } = req.body;

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

    // Get release rules
    const rules = getReleaseRules(deal);

    // Find escrowed earnings to release
    let earningsToRelease;
    if (earningIds.length > 0) {
      earningsToRelease = await Earning.find({
        _id: { $in: earningIds },
        deal: deal._id,
        status: 'escrowed'
      });
    } else {
      // Release all eligible earnings
      earningsToRelease = await Earning.find({
        deal: deal._id,
        status: 'escrowed'
      });
    }

    if (earningsToRelease.length === 0) {
      return errorResponse(res, "No eligible earnings found for release", 404);
    }

    const releasedEarnings = [];
    const failedReleases = [];

    for (const earning of earningsToRelease) {
      try {
        // Check if this earning is eligible for release
        const escrowDate = earning.createdAt;
        const currentDate = new Date();
        const daysSinceEscrowed = Math.floor((currentDate - escrowDate) / (1000 * 60 * 60 * 24));
        
        let isEligible = false;
        
        if (forceRelease) {
          isEligible = true;
        } else if (deal.status === 'completed') {
          const releaseDate = calculateReleaseDate(deal, rules);
          isEligible = currentDate >= releaseDate;
        } else if (daysSinceEscrowed >= rules.maxEscrowDays) {
          isEligible = true;
        } else if (earning.metadata?.milestoneId) {
          const milestone = deal.milestones?.find(m => 
            m._id.toString() === earning.metadata.milestoneId
          );
          isEligible = milestone && milestone.status === 'completed';
        }

        if (!isEligible && !forceRelease) {
          failedReleases.push({
            earningId: earning._id,
            amount: earning.amount,
            reason: 'Not eligible for release yet'
          });
          continue;
        }

        // Release the payment
        earning.status = 'completed';
        earning.releasedAt = new Date();
        earning.releaseType = releaseType;
        earning.releasedBy = req.user.id;
        if (reason) {
          earning.releaseReason = reason;
        }
        await earning.save();

        // Update milestone status if applicable
        if (earning.metadata?.milestoneId) {
          const milestone = deal.milestones?.find(m => 
            m._id.toString() === earning.metadata.milestoneId
          );
          if (milestone && milestone.status !== 'completed') {
            milestone.status = 'completed';
            milestone.completedAt = new Date();
          }
        }

        // Update deal transaction status
        const transaction = deal.paymentInfo?.transactions?.find(t => 
          t.transactionId === earning.transactionId
        );
        if (transaction) {
          transaction.status = 'Completed';
          transaction.releasedAt = new Date();
          transaction.releaseType = releaseType;
        }

        releasedEarnings.push({
          earningId: earning._id,
          amount: earning.amount,
          releasedAt: earning.releasedAt,
          milestoneId: earning.metadata?.milestoneId
        });

      } catch (releaseError) {
        console.error(`Error releasing earning ${earning._id}:`, releaseError);
        failedReleases.push({
          earningId: earning._id,
          amount: earning.amount,
          reason: releaseError.message
        });
      }
    }

    // Save deal changes
    deal.markModified('milestones');
    deal.markModified('paymentInfo');
    await deal.save();

    // Check if all payments are now released
    const remainingEscrow = await Earning.find({
      deal: deal._id,
      status: 'escrowed'
    });

    // Update deal status if all payments released
    if (remainingEscrow.length === 0 && deal.status === 'active') {
      deal.status = 'completed';
      await deal.save();
    }

    // Send notifications
    if (releasedEarnings.length > 0) {
      await this.sendReleaseNotifications(deal, releasedEarnings, releaseType);
    }

    const totalReleased = releasedEarnings.reduce((sum, e) => sum + e.amount, 0);
    const totalFailed = failedReleases.reduce((sum, e) => sum + e.amount, 0);

    return successResponse(res, "Automatic payment release completed", {
      deal: {
        id: deal._id,
        dealNumber: deal.dealNumber,
        status: deal.status
      },
      release: {
        totalReleased,
        totalFailed,
        releasedCount: releasedEarnings.length,
        failedCount: failedReleases.length,
        releaseType
      },
      details: {
        releasedEarnings,
        failedReleases
      },
      remainingEscrow: {
        count: remainingEscrow.length,
        amount: remainingEscrow.reduce((sum, e) => sum + e.amount, 0)
      }
    });

  } catch (error) {
    console.error("Error triggering automatic release:", error);
    return handleServerError(res, error);
  }
};

// Schedule future automatic release
exports.scheduleAutomaticRelease = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { 
      releaseDate,
      earningIds = [],
      reason,
      notifyParties = true 
    } = req.body;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check authorization (only marketer can schedule)
    if (deal.marketerId.toString() !== req.user.id) {
      return errorResponse(res, "Only marketer can schedule automatic releases", 403);
    }

    // Validate release date
    const scheduledDate = new Date(releaseDate);
    if (scheduledDate <= new Date()) {
      return errorResponse(res, "Release date must be in the future", 400);
    }

    // Find earnings to schedule
    const earningsToSchedule = await Earning.find({
      _id: { $in: earningIds.length > 0 ? earningIds : undefined },
      deal: deal._id,
      status: 'escrowed'
    });

    if (earningsToSchedule.length === 0) {
      return errorResponse(res, "No eligible earnings found to schedule", 404);
    }

    // Update earnings with scheduled release
    const scheduledEarnings = [];
    for (const earning of earningsToSchedule) {
      if (!earning.metadata) {
        earning.metadata = {};
      }
      earning.metadata.scheduledReleaseDate = scheduledDate;
      earning.metadata.scheduledBy = req.user.id;
      if (reason) {
        earning.metadata.scheduleReason = reason;
      }
      await earning.save();

      scheduledEarnings.push({
        earningId: earning._id,
        amount: earning.amount,
        scheduledDate
      });
    }

    // Send notifications if requested
    if (notifyParties) {
      await this.sendScheduleNotifications(deal, scheduledEarnings, scheduledDate);
    }

    const totalScheduled = scheduledEarnings.reduce((sum, e) => sum + e.amount, 0);

    return successResponse(res, "Automatic release scheduled successfully", {
      deal: {
        id: deal._id,
        dealNumber: deal.dealNumber
      },
      scheduled: {
        releaseDate: scheduledDate,
        earningsCount: scheduledEarnings.length,
        totalAmount: totalScheduled,
        scheduledBy: req.user.id
      },
      scheduledEarnings
    });

  } catch (error) {
    console.error("Error scheduling automatic release:", error);
    return handleServerError(res, error);
  }
};

// Get automatic release status for a deal
exports.getAutomaticReleaseStatus = async (req, res) => {
  try {
    const { dealId } = req.params;

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

    // Get all earnings for this deal
    const allEarnings = await Earning.find({ deal: deal._id });
    const escrowedEarnings = allEarnings.filter(e => e.status === 'escrowed');
    const releasedEarnings = allEarnings.filter(e => e.status === 'completed');

    // Get release rules
    const rules = getReleaseRules(deal);

    // Calculate status for each escrowed earning
    const escrowStatus = escrowedEarnings.map(earning => {
      const escrowDate = earning.createdAt;
      const currentDate = new Date();
      const daysSinceEscrowed = Math.floor((currentDate - escrowDate) / (1000 * 60 * 60 * 24));
      
      let nextReleaseDate = null;
      let status = 'pending';
      
      if (earning.metadata?.scheduledReleaseDate) {
        nextReleaseDate = new Date(earning.metadata.scheduledReleaseDate);
        status = 'scheduled';
      } else if (deal.status === 'completed') {
        nextReleaseDate = calculateReleaseDate(deal, rules);
        status = currentDate >= nextReleaseDate ? 'eligible' : 'grace_period';
      } else if (daysSinceEscrowed >= rules.maxEscrowDays) {
        status = 'overdue';
        nextReleaseDate = new Date(escrowDate.getTime() + (rules.maxEscrowDays * 24 * 60 * 60 * 1000));
      }

      return {
        earningId: earning._id,
        amount: earning.amount,
        escrowedAt: earning.createdAt,
        daysSinceEscrowed,
        status,
        nextReleaseDate,
        milestoneId: earning.metadata?.milestoneId,
        scheduledBy: earning.metadata?.scheduledBy,
        scheduleReason: earning.metadata?.scheduleReason
      };
    });

    // Calculate summary statistics
    const summary = {
      totalEarnings: allEarnings.length,
      totalAmount: allEarnings.reduce((sum, e) => sum + e.amount, 0),
      escrowedCount: escrowedEarnings.length,
      escrowedAmount: escrowedEarnings.reduce((sum, e) => sum + e.amount, 0),
      releasedCount: releasedEarnings.length,
      releasedAmount: releasedEarnings.reduce((sum, e) => sum + e.amount, 0),
      eligibleCount: escrowStatus.filter(e => e.status === 'eligible').length,
      eligibleAmount: escrowStatus.filter(e => e.status === 'eligible').reduce((sum, e) => sum + e.amount, 0),
      scheduledCount: escrowStatus.filter(e => e.status === 'scheduled').length,
      scheduledAmount: escrowStatus.filter(e => e.status === 'scheduled').reduce((sum, e) => sum + e.amount, 0)
    };

    return successResponse(res, "Automatic release status retrieved successfully", {
      deal: {
        id: deal._id,
        dealNumber: deal.dealNumber,
        dealName: deal.dealName,
        status: deal.status,
        completedAt: deal.completedAt
      },
      rules: {
        gracePeriodDays: rules.gracePeriodDays,
        maxEscrowDays: rules.maxEscrowDays,
        requiresApproval: rules.requiresApproval
      },
      summary,
      escrowStatus,
      permissions: {
        canTriggerRelease: isMarketer || isCreator,
        canScheduleRelease: isMarketer,
        canForceRelease: false // Reserved for admin
      }
    });

  } catch (error) {
    console.error("Error getting automatic release status:", error);
    return handleServerError(res, error);
  }
};

// Notification helper functions
exports.sendReleaseNotifications = async (deal, releasedEarnings, releaseType) => {
  try {
    const totalReleased = releasedEarnings.reduce((sum, e) => sum + e.amount, 0);
    
    const notifications = [
      {
        user: deal.creatorId._id,
        type: "payment_auto_released",
        title: "Payment Released",
        subtitle: `$${totalReleased} has been automatically released for deal ${deal.dealNumber}`,
        data: {
          dealId: deal._id.toString(),
          amount: totalReleased.toString(),
          releaseType,
          earningsCount: releasedEarnings.length.toString()
        }
      },
      {
        user: deal.marketerId._id,
        type: "payment_auto_released",
        title: "Payment Released",
        subtitle: `$${totalReleased} has been automatically released to ${deal.creatorId.userName} for deal ${deal.dealNumber}`,
        data: {
          dealId: deal._id.toString(),
          amount: totalReleased.toString(),
          releaseType,
          earningsCount: releasedEarnings.length.toString()
        }
      }
    ];

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error sending release notifications:', error);
  }
};

exports.sendScheduleNotifications = async (deal, scheduledEarnings, scheduledDate) => {
  try {
    const totalScheduled = scheduledEarnings.reduce((sum, e) => sum + e.amount, 0);
    
    const notifications = [
      {
        user: deal.creatorId._id,
        type: "payment_release_scheduled",
        title: "Payment Release Scheduled",
        subtitle: `$${totalScheduled} is scheduled for automatic release on ${scheduledDate.toDateString()}`,
        data: {
          dealId: deal._id.toString(),
          amount: totalScheduled.toString(),
          scheduledDate: scheduledDate.toISOString(),
          earningsCount: scheduledEarnings.length.toString()
        }
      },
      {
        user: deal.marketerId._id,
        type: "payment_release_scheduled",
        title: "Payment Release Scheduled",
        subtitle: `$${totalScheduled} scheduled for automatic release to ${deal.creatorId.userName} on ${scheduledDate.toDateString()}`,
        data: {
          dealId: deal._id.toString(),
          amount: totalScheduled.toString(),
          scheduledDate: scheduledDate.toISOString(),
          earningsCount: scheduledEarnings.length.toString()
        }
      }
    ];

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error sending schedule notifications:', error);
  }
};

module.exports = exports;