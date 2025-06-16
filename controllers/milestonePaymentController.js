const Deal = require('../models/deal');
const User = require('../models/User');
const Earning = require('../models/earnings');
const Payout = require('../models/payouts');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');

/**
 * Advanced Milestone Payment Splitting Controller
 * Handles complex milestone-based payment structures with proper splitting,
 * escrow management, and automatic release mechanisms.
 */

// Helper function to calculate milestone amounts based on templates
const calculateMilestoneAmounts = (totalAmount, template, customPercentages = []) => {
  const templates = {
    equal_split: (count) => Array(count).fill(100 / count),
    front_loaded: (count) => {
      if (count === 2) return [70, 30];
      if (count === 3) return [50, 30, 20];
      if (count === 4) return [40, 30, 20, 10];
      return Array(count).fill(100 / count);
    },
    back_loaded: (count) => {
      if (count === 2) return [30, 70];
      if (count === 3) return [20, 30, 50];
      if (count === 4) return [10, 20, 30, 40];
      return Array(count).fill(100 / count);
    },
    custom: () => customPercentages
  };

  const count = template === 'custom' ? customPercentages.length : 
                Math.min(4, Math.max(1, parseInt(process.env.DEFAULT_MILESTONE_COUNT) || 2));
  
  const percentages = templates[template] ? templates[template](count) : templates.equal_split(count);
  
  // Ensure percentages add up to 100
  const sum = percentages.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 0.01) {
    throw new Error(`Milestone percentages must total 100%. Current total: ${sum}%`);
  }

  return percentages.map((percentage, index) => ({
    order: index + 1,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
    amount: Math.round((percentage / 100) * totalAmount * 100) / 100
  }));
};

// Create milestone payment structure
exports.createMilestoneStructure = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { 
      template = 'equal_split',
      customPercentages = [],
      milestoneDetails = [],
      autoReleaseDays = 7
    } = req.body;

    // Validate deal access
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check authorization
    const isCreator = deal.creatorId.toString() === req.user.id;
    const isMarketer = deal.marketerId.toString() === req.user.id;
    
    if (!isCreator && !isMarketer) {
      return errorResponse(res, "Unauthorized access to deal", 403);
    }

    // Prevent modification if payments already made
    if (deal.paymentInfo?.transactions?.length > 0) {
      return errorResponse(res, "Cannot modify milestone structure after payments have been made", 400);
    }

    const totalAmount = deal.paymentInfo?.paymentAmount || 0;
    if (totalAmount <= 0) {
      return errorResponse(res, "Deal must have a valid payment amount", 400);
    }

    // Calculate milestone amounts
    const milestoneAmounts = calculateMilestoneAmounts(
      totalAmount, 
      template, 
      customPercentages
    );

    // Create milestones with details
    const milestones = milestoneAmounts.map((milestone, index) => {
      const detail = milestoneDetails[index] || {};
      const baseDate = new Date();
      const dueDate = new Date(baseDate.getTime() + ((index + 1) * 7 * 24 * 60 * 60 * 1000)); // Weekly intervals

      return {
        _id: new mongoose.Types.ObjectId(),
        name: detail.name || `Milestone ${milestone.order}`,
        label: milestone.order === 1 ? 'Initial Payment' : 
               milestone.order === milestoneAmounts.length ? 'Final Payment' : 
               'Progress Payment',
        order: milestone.order,
        amount: milestone.amount,
        percentage: milestone.percentage,
        bonus: detail.bonus || 0,
        dueDate: detail.dueDate ? new Date(detail.dueDate) : dueDate,
        deliverables: detail.deliverables || [],
        description: detail.description || `Payment milestone ${milestone.order}`,
        status: 'pending',
        createdAt: new Date(),
        createdBy: req.user.id,
        autoReleaseDate: detail.autoReleaseDate || 
          new Date(dueDate.getTime() + (autoReleaseDays * 24 * 60 * 60 * 1000)),
        visualConfig: {
          color: detail.color || '#430B92',
          icon: detail.icon || 'milestone',
          progressPercentage: 0
        }
      };
    });

    // Update deal with milestone structure
    deal.milestones = milestones;
    deal.milestoneTemplate = template;
    deal.markModified('milestones');
    await deal.save();

    // Create milestone tracking entries
    const milestoneTracking = milestones.map(milestone => ({
      milestoneId: milestone._id,
      dealId: deal._id,
      amount: milestone.amount,
      status: 'created',
      createdAt: new Date(),
      events: [{
        type: 'created',
        timestamp: new Date(),
        userId: req.user.id,
        description: 'Milestone structure created'
      }]
    }));

    return successResponse(res, "Milestone payment structure created successfully", {
      deal: {
        id: deal._id,
        dealNumber: deal.dealNumber,
        totalAmount: totalAmount,
        template: template
      },
      milestones: milestones.map(m => ({
        id: m._id,
        name: m.name,
        order: m.order,
        amount: m.amount,
        percentage: m.percentage,
        dueDate: m.dueDate,
        status: m.status,
        deliverables: m.deliverables
      })),
      summary: {
        totalMilestones: milestones.length,
        totalAmount: milestones.reduce((sum, m) => sum + m.amount, 0),
        averageAmount: milestones.reduce((sum, m) => sum + m.amount, 0) / milestones.length
      }
    });

  } catch (error) {
    console.error("Error creating milestone structure:", error);
    return handleServerError(res, error);
  }
};

// Fund a specific milestone
exports.fundMilestone = async (req, res) => {
  try {
    const { dealId, milestoneId } = req.params;
    const { paymentMethodId, includeFee = true } = req.body;

    const deal = await Deal.findById(dealId)
      .populate('creatorId', 'userName email stripeConnectId')
      .populate('marketerId', 'userName email stripeCustomerId');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Find the milestone
    const milestone = deal.milestones.find(m => 
      m._id.toString() === milestoneId || m.id?.toString() === milestoneId
    );

    if (!milestone) {
      return errorResponse(res, "Milestone not found", 404);
    }

    // Check authorization (only marketer can fund)
    if (deal.marketerId._id.toString() !== req.user.id) {
      return errorResponse(res, "Only the marketer can fund milestones", 403);
    }

    // Check if already funded
    if (milestone.status === 'funded' || milestone.fundedAt) {
      return errorResponse(res, "Milestone is already funded", 400);
    }

    // Calculate total amount including platform fee
    const milestoneAmount = milestone.amount + (milestone.bonus || 0);
    const platformFee = includeFee ? milestoneAmount * 0.1 : 0; // 10% platform fee
    const totalAmount = milestoneAmount + platformFee;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        dealId: deal._id.toString(),
        milestoneId: milestone._id.toString(),
        milestoneAmount: milestoneAmount.toString(),
        platformFee: platformFee.toString(),
        type: 'milestone_funding'
      }
    });

    if (paymentIntent.status === 'succeeded') {
      // Update milestone status
      milestone.status = 'funded';
      milestone.fundedAt = new Date();
      milestone.transactionId = paymentIntent.id;
      milestone.paymentIntentId = paymentIntent.id;

      // Add transaction to deal
      if (!deal.paymentInfo) {
        deal.paymentInfo = { transactions: [] };
      }
      if (!Array.isArray(deal.paymentInfo.transactions)) {
        deal.paymentInfo.transactions = [];
      }

      deal.paymentInfo.transactions.push({
        paymentAmount: milestoneAmount,
        bonusAmount: milestone.bonus || 0,
        feeAmount: platformFee,
        paymentMethod: "CreditCard",
        transactionId: paymentIntent.id,
        status: "Escrowed", // Held in escrow until milestone completion
        paidAt: new Date(),
        type: "milestone",
        milestoneId: milestone._id,
        metadata: {
          milestoneOrder: milestone.order,
          milestoneName: milestone.name
        }
      });

      deal.markModified('milestones');
      deal.markModified('paymentInfo');
      await deal.save();

      // Create escrow entry (earnings held until release)
      await Earning.create({
        user: deal.creatorId._id,
        amount: milestoneAmount,
        deal: deal._id,
        paymentMethod: "CreditCard",
        transactionId: paymentIntent.id,
        reference: `Milestone: ${milestone.name}`,
        status: "escrowed",
        metadata: {
          milestoneId: milestone._id.toString(),
          milestoneOrder: milestone.order,
          autoReleaseDate: milestone.autoReleaseDate
        },
        createdAt: new Date()
      });

      // Create payout record for marketer (expense tracking)
      await Payout.create({
        user: deal.marketerId._id,
        amount: totalAmount,
        paymentMethod: "CreditCard",
        stripeTransactionId: paymentIntent.id,
        deal: deal._id,
        status: "COMPLETED",
        metadata: {
          type: "milestone_funding",
          milestoneId: milestone._id.toString(),
          milestoneAmount: milestoneAmount,
          platformFee: platformFee
        },
        requestedAt: new Date()
      });

      // Notify creator
      await this.notifyMilestoneFunded(deal.creatorId._id, deal, milestone);

      return successResponse(res, "Milestone funded successfully", {
        milestone: {
          id: milestone._id,
          name: milestone.name,
          order: milestone.order,
          amount: milestoneAmount,
          status: milestone.status,
          fundedAt: milestone.fundedAt,
          autoReleaseDate: milestone.autoReleaseDate
        },
        payment: {
          transactionId: paymentIntent.id,
          totalAmount: totalAmount,
          milestoneAmount: milestoneAmount,
          platformFee: platformFee,
          status: paymentIntent.status
        }
      });

    } else {
      return errorResponse(res, "Payment failed", 400, {
        paymentStatus: paymentIntent.status,
        error: paymentIntent.last_payment_error?.message
      });
    }

  } catch (error) {
    console.error("Error funding milestone:", error);
    return handleServerError(res, error);
  }
};

// Release milestone payment to creator
exports.releaseMilestonePayment = async (req, res) => {
  try {
    const { dealId, milestoneId } = req.params;
    const { releaseType = 'manual', reason } = req.body;

    const deal = await Deal.findById(dealId)
      .populate('creatorId', 'userName email stripeConnectId')
      .populate('marketerId', 'userName email');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    const milestone = deal.milestones.find(m => 
      m._id.toString() === milestoneId || m.id?.toString() === milestoneId
    );

    if (!milestone) {
      return errorResponse(res, "Milestone not found", 404);
    }

    // Check authorization
    const isCreator = deal.creatorId._id.toString() === req.user.id;
    const isMarketer = deal.marketerId._id.toString() === req.user.id;
    const isAutoRelease = releaseType === 'automatic';
    
    if (!isCreator && !isMarketer && !isAutoRelease) {
      return errorResponse(res, "Unauthorized access", 403);
    }

    // Check if milestone is funded
    if (milestone.status !== 'funded' && milestone.status !== 'completed') {
      return errorResponse(res, "Milestone must be funded before release", 400);
    }

    // Check if already released
    if (milestone.status === 'released') {
      return errorResponse(res, "Milestone payment already released", 400);
    }

    // For manual release, check if marketer is releasing or auto-release date has passed
    if (releaseType === 'manual' && !isMarketer) {
      if (new Date() < new Date(milestone.autoReleaseDate)) {
        return errorResponse(res, "Only marketer can release before auto-release date", 403);
      }
    }

    // Find escrowed earning
    const escrowedEarning = await Earning.findOne({
      deal: deal._id,
      'metadata.milestoneId': milestone._id.toString(),
      status: 'escrowed'
    });

    if (!escrowedEarning) {
      return errorResponse(res, "No escrowed payment found for this milestone", 404);
    }

    // Release the payment
    escrowedEarning.status = 'completed';
    escrowedEarning.releasedAt = new Date();
    escrowedEarning.releaseType = releaseType;
    escrowedEarning.releasedBy = req.user.id;
    if (reason) {
      escrowedEarning.releaseReason = reason;
    }
    await escrowedEarning.save();

    // Update milestone status
    milestone.status = 'completed';
    milestone.completedAt = new Date();
    milestone.releaseScheduled = false;

    // Update deal transaction
    const transaction = deal.paymentInfo.transactions.find(t => 
      t.milestoneId?.toString() === milestone._id.toString()
    );
    if (transaction) {
      transaction.status = 'Completed';
      transaction.releasedAt = new Date();
      transaction.releaseType = releaseType;
    }

    deal.markModified('milestones');
    deal.markModified('paymentInfo');
    await deal.save();

    // If all milestones are completed, update deal status
    const allMilestonesCompleted = deal.milestones.every(m => 
      m.status === 'completed' || m.status === 'cancelled'
    );
    if (allMilestonesCompleted) {
      deal.status = 'completed';
      await deal.save();
    }

    // Notify both parties
    await this.notifyMilestoneReleased(deal.creatorId._id, deal, milestone, releaseType);
    await this.notifyMilestoneReleased(deal.marketerId._id, deal, milestone, releaseType);

    return successResponse(res, "Milestone payment released successfully", {
      milestone: {
        id: milestone._id,
        name: milestone.name,
        order: milestone.order,
        amount: escrowedEarning.amount,
        status: milestone.status,
        completedAt: milestone.completedAt,
        releaseType: releaseType
      },
      earning: {
        id: escrowedEarning._id,
        amount: escrowedEarning.amount,
        status: escrowedEarning.status,
        releasedAt: escrowedEarning.releasedAt
      },
      deal: {
        id: deal._id,
        status: deal.status,
        allMilestonesCompleted: allMilestonesCompleted
      }
    });

  } catch (error) {
    console.error("Error releasing milestone payment:", error);
    return handleServerError(res, error);
  }
};

// Get milestone payment status and breakdown
exports.getMilestonePaymentStatus = async (req, res) => {
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

    // Get earnings for each milestone
    const milestoneEarnings = await Earning.find({
      deal: deal._id,
      'metadata.milestoneId': { $exists: true }
    });

    // Calculate milestone payment breakdown
    const milestoneDetails = await Promise.all(
      deal.milestones.map(async (milestone) => {
        const earning = milestoneEarnings.find(e => 
          e.metadata?.milestoneId === milestone._id.toString()
        );

        const transaction = deal.paymentInfo?.transactions?.find(t => 
          t.milestoneId?.toString() === milestone._id.toString()
        );

        return {
          id: milestone._id,
          name: milestone.name,
          order: milestone.order,
          amount: milestone.amount,
          percentage: milestone.percentage,
          bonus: milestone.bonus || 0,
          status: milestone.status,
          dueDate: milestone.dueDate,
          autoReleaseDate: milestone.autoReleaseDate,
          deliverables: milestone.deliverables,
          fundedAt: milestone.fundedAt,
          completedAt: milestone.completedAt,
          payment: {
            transactionId: milestone.transactionId,
            paymentStatus: earning?.status,
            earningId: earning?._id,
            releasedAt: earning?.releasedAt,
            releaseType: earning?.releaseType
          },
          transaction: transaction ? {
            id: transaction._id,
            status: transaction.status,
            paidAt: transaction.paidAt,
            releasedAt: transaction.releasedAt,
            feeAmount: transaction.feeAmount
          } : null,
          canRelease: milestone.status === 'funded' && 
                     (isMarketer || new Date() >= new Date(milestone.autoReleaseDate)),
          isOverdue: new Date() > new Date(milestone.dueDate) && milestone.status !== 'completed'
        };
      })
    );

    // Calculate summary statistics
    const totalAmount = deal.milestones.reduce((sum, m) => sum + m.amount, 0);
    const fundedAmount = deal.milestones
      .filter(m => m.status === 'funded' || m.status === 'completed')
      .reduce((sum, m) => sum + m.amount, 0);
    const releasedAmount = deal.milestones
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.amount, 0);
    const escrowedAmount = fundedAmount - releasedAmount;

    const summary = {
      totalMilestones: deal.milestones.length,
      completedMilestones: deal.milestones.filter(m => m.status === 'completed').length,
      fundedMilestones: deal.milestones.filter(m => m.status === 'funded' || m.status === 'completed').length,
      pendingMilestones: deal.milestones.filter(m => m.status === 'pending').length,
      totalAmount: totalAmount,
      fundedAmount: fundedAmount,
      releasedAmount: releasedAmount,
      escrowedAmount: escrowedAmount,
      completionPercentage: (deal.milestones.filter(m => m.status === 'completed').length / deal.milestones.length) * 100
    };

    return successResponse(res, "Milestone payment status retrieved successfully", {
      deal: {
        id: deal._id,
        dealNumber: deal.dealNumber,
        dealName: deal.dealName,
        status: deal.status,
        template: deal.milestoneTemplate
      },
      milestones: milestoneDetails,
      summary: summary,
      permissions: {
        canFund: isMarketer,
        canRelease: isMarketer || isCreator,
        canModify: deal.paymentInfo?.transactions?.length === 0
      }
    });

  } catch (error) {
    console.error("Error getting milestone payment status:", error);
    return handleServerError(res, error);
  }
};

// Schedule automatic release for overdue milestones
exports.scheduleAutomaticRelease = async (req, res) => {
  try {
    const { dealId, milestoneId } = req.params;
    const { releaseDate } = req.body;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    const milestone = deal.milestones.find(m => 
      m._id.toString() === milestoneId || m.id?.toString() === milestoneId
    );

    if (!milestone) {
      return errorResponse(res, "Milestone not found", 404);
    }

    // Check authorization (only marketer can schedule)
    if (deal.marketerId.toString() !== req.user.id) {
      return errorResponse(res, "Only marketer can schedule automatic release", 403);
    }

    // Validate release date
    const scheduledDate = new Date(releaseDate);
    if (scheduledDate <= new Date()) {
      return errorResponse(res, "Release date must be in the future", 400);
    }

    // Update milestone
    milestone.releaseScheduled = true;
    milestone.autoReleaseDate = scheduledDate;

    deal.markModified('milestones');
    await deal.save();

    return successResponse(res, "Automatic release scheduled successfully", {
      milestone: {
        id: milestone._id,
        name: milestone.name,
        autoReleaseDate: milestone.autoReleaseDate,
        releaseScheduled: milestone.releaseScheduled
      }
    });

  } catch (error) {
    console.error("Error scheduling automatic release:", error);
    return handleServerError(res, error);
  }
};

// Notification helpers
exports.notifyMilestoneFunded = async (userId, deal, milestone) => {
  try {
    const message = `Milestone "${milestone.name}" has been funded for deal ${deal.dealNumber}. Amount: $${milestone.amount}`;
    
    await Notification.create({
      user: userId,
      type: "milestone_funded",
      title: "Milestone Funded",
      subtitle: message,
      data: {
        dealId: deal._id.toString(),
        milestoneId: milestone._id.toString(),
        amount: milestone.amount.toString()
      },
      unread: true
    });
  } catch (error) {
    console.error("Error sending milestone funded notification:", error);
  }
};

exports.notifyMilestoneReleased = async (userId, deal, milestone, releaseType) => {
  try {
    const message = `Milestone "${milestone.name}" payment has been released for deal ${deal.dealNumber}. Release type: ${releaseType}`;
    
    await Notification.create({
      user: userId,
      type: "milestone_released",
      title: "Milestone Payment Released",
      subtitle: message,
      data: {
        dealId: deal._id.toString(),
        milestoneId: milestone._id.toString(),
        releaseType: releaseType
      },
      unread: true
    });
  } catch (error) {
    console.error("Error sending milestone released notification:", error);
  }
};

module.exports = exports;