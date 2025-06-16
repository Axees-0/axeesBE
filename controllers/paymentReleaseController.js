const Deal = require("../models/deal");
const User = require("../models/user");
const Payment = require("../models/payment");
const Notification = require("../models/notification");
const { sendNotification } = require("../utils/notifications");

// -------------------------------------------------------------------
// AUTOMATIC PAYMENT RELEASE SYSTEM
// -------------------------------------------------------------------

// Helper to check if a milestone is eligible for automatic release
const checkMilestoneEligibility = (milestone, deal) => {
  if (!milestone || milestone.status !== 'approved') {
    return { eligible: false, reason: 'Milestone not approved' };
  }

  if (milestone.disputeFlag) {
    return { eligible: false, reason: 'Milestone has active dispute' };
  }

  if (!milestone.autoReleaseDate) {
    return { eligible: false, reason: 'No auto-release date set' };
  }

  if (new Date() < new Date(milestone.autoReleaseDate)) {
    return { eligible: false, reason: 'Auto-release date not reached' };
  }

  if (milestone.releaseScheduled) {
    return { eligible: false, reason: 'Release already scheduled' };
  }

  return { eligible: true };
};

// Process automatic payment releases for all eligible milestones
exports.processAutomaticReleases = async (req, res) => {
  try {
    // Find all active deals with automatic release enabled
    const deals = await Deal.find({
      status: 'active',
      'paymentInfo.automaticRelease.enabled': true,
      'milestones.status': 'approved',
      'milestones.autoReleaseDate': { $lte: new Date() },
      'milestones.releaseScheduled': false,
      'milestones.disputeFlag': false
    }).populate([
      { path: 'marketerId', select: 'name email deviceToken' },
      { path: 'creatorId', select: 'name email deviceToken' }
    ]);

    const results = {
      processed: 0,
      released: 0,
      failed: 0,
      totalAmount: 0,
      errors: []
    };

    for (const deal of deals) {
      for (const milestone of deal.milestones) {
        const eligibility = checkMilestoneEligibility(milestone, deal);
        
        if (!eligibility.eligible) {
          continue;
        }

        try {
          // Process the automatic release
          const releaseResult = await processPaymentRelease(deal, milestone);
          
          if (releaseResult.success) {
            results.released++;
            results.totalAmount += milestone.amount;
            
            // Update milestone status
            milestone.status = 'completed';
            milestone.completedAt = new Date();
            milestone.releaseScheduled = true;
            
            // Record the transaction
            deal.paymentInfo.transactions.push({
              paymentAmount: milestone.amount,
              paymentMethod: 'automatic_release',
              transactionId: releaseResult.transactionId,
              paymentIntentId: releaseResult.paymentIntentId,
              type: 'auto_release',
              status: 'completed',
              releasedAt: new Date(),
              milestoneId: milestone._id,
              isAutomatic: true,
              metadata: {
                releaseType: 'time_based',
                scheduledDate: milestone.autoReleaseDate,
                processingTime: new Date() - new Date(milestone.autoReleaseDate)
              }
            });

            // Update payment totals
            deal.paymentInfo.totalReleased += milestone.amount;
            deal.paymentInfo.milestoneBreakdown.completedMilestones++;
            
            // Check if all milestones are completed
            const allCompleted = deal.milestones.every(m => m.status === 'completed');
            if (allCompleted) {
              deal.status = 'completed';
              deal.paymentInfo.paymentStatus = 'Released';
            }

            await deal.save();

            // Send notifications
            await sendReleaseNotifications(deal, milestone, 'automatic');
            
            console.log(`✅ Auto-released milestone "${milestone.name}" for deal ${deal.dealNumber}: ${milestone.amount}`);
          } else {
            results.failed++;
            results.errors.push({
              dealId: deal._id,
              milestoneId: milestone._id,
              error: releaseResult.error
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            dealId: deal._id,
            milestoneId: milestone._id,
            error: error.message
          });
        }
        
        results.processed++;
      }
    }

    return res.json({
      success: true,
      message: 'Automatic payment release processing completed',
      results
    });

  } catch (error) {
    console.error('Error processing automatic releases:', error);
    return res.status(500).json({ 
      error: 'Failed to process automatic releases',
      details: error.message 
    });
  }
};

// Process a single payment release
const processPaymentRelease = async (deal, milestone) => {
  try {
    // Here you would integrate with your payment provider (Stripe, PayPal, etc.)
    // This is a placeholder for the actual payment processing logic
    
    const payment = {
      amount: milestone.amount,
      currency: deal.paymentInfo.currency,
      recipient: deal.creatorId,
      dealId: deal._id,
      milestoneId: milestone._id,
      description: `Milestone payment: ${milestone.name} - Deal: ${deal.dealNumber}`
    };

    // Simulate payment processing
    // In production, replace with actual payment API call
    const paymentResult = await simulatePaymentRelease(payment);
    
    return paymentResult;
  } catch (error) {
    console.error('Payment release error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Simulate payment release (replace with actual payment provider integration)
const simulatePaymentRelease = async (payment) => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Generate mock transaction IDs
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const paymentIntentId = `PI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    success: true,
    transactionId,
    paymentIntentId,
    amount: payment.amount,
    currency: payment.currency
  };
};

// Send notifications for payment release
const sendReleaseNotifications = async (deal, milestone, releaseType) => {
  try {
    const notifications = [
      {
        user: deal.creatorId,
        role: 'creator',
        message: `Payment of ${formatCurrency(milestone.amount, deal.paymentInfo.currency)} has been ${releaseType === 'automatic' ? 'automatically' : ''} released for milestone "${milestone.name}" in deal "${deal.dealName}"`
      },
      {
        user: deal.marketerId,
        role: 'marketer',
        message: `Payment of ${formatCurrency(milestone.amount, deal.paymentInfo.currency)} has been ${releaseType === 'automatic' ? 'automatically' : ''} released to creator for milestone "${milestone.name}" in deal "${deal.dealName}"`
      }
    ];

    for (const notification of notifications) {
      // Send push notification
      if (notification.user.deviceToken) {
        await sendNotification({
          token: notification.user.deviceToken,
          title: 'Payment Released',
          body: notification.message,
          data: {
            type: 'payment_release',
            dealId: deal._id.toString(),
            milestoneId: milestone._id.toString(),
            amount: milestone.amount.toString(),
            releaseType
          }
        });
      }

      // Create notification record
      await Notification.create({
        userId: notification.user._id,
        type: 'payment_release',
        title: 'Payment Released',
        message: notification.message,
        metadata: {
          dealId: deal._id,
          milestoneId: milestone._id,
          amount: milestone.amount,
          releaseType
        }
      });

      // Send email notification
      // This would integrate with your email service
      console.log(`📧 Email notification would be sent to ${notification.user.email}: ${notification.message}`);
    }
  } catch (error) {
    console.error('Error sending release notifications:', error);
  }
};

// Manual trigger for automatic release (for testing or admin override)
exports.triggerManualRelease = async (req, res) => {
  try {
    const { dealId, milestoneId } = req.params;
    const { reason } = req.body;

    const deal = await Deal.findById(dealId).populate([
      { path: 'marketerId', select: 'name email' },
      { path: 'creatorId', select: 'name email' }
    ]);

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const milestone = deal.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (milestone.status === 'completed') {
      return res.status(400).json({ error: 'Milestone already completed' });
    }

    if (milestone.status !== 'approved' && milestone.status !== 'funded') {
      return res.status(400).json({ 
        error: 'Milestone must be approved or funded for manual release',
        currentStatus: milestone.status 
      });
    }

    // Process the manual release
    const releaseResult = await processPaymentRelease(deal, milestone);

    if (releaseResult.success) {
      milestone.status = 'completed';
      milestone.completedAt = new Date();
      
      deal.paymentInfo.transactions.push({
        paymentAmount: milestone.amount,
        paymentMethod: 'manual_release',
        transactionId: releaseResult.transactionId,
        type: 'milestone',
        status: 'completed',
        releasedAt: new Date(),
        milestoneId: milestone._id,
        metadata: {
          releaseType: 'manual',
          reason,
          releasedBy: req.user?._id
        }
      });

      deal.paymentInfo.totalReleased += milestone.amount;
      await deal.save();

      await sendReleaseNotifications(deal, milestone, 'manual');

      return res.json({
        success: true,
        message: 'Payment released successfully',
        transaction: releaseResult
      });
    } else {
      return res.status(500).json({
        error: 'Payment release failed',
        details: releaseResult.error
      });
    }

  } catch (error) {
    console.error('Error in manual release:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Dispute resolution system
exports.createDispute = async (req, res) => {
  try {
    const { dealId, milestoneId } = req.params;
    const { reason, description, evidence } = req.body;
    const userId = req.user?._id;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const milestone = deal.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Check if user is part of the deal
    const isMarketer = String(deal.marketerId) === String(userId);
    const isCreator = String(deal.creatorId) === String(userId);
    
    if (!isMarketer && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to create dispute' });
    }

    // Set dispute flag
    milestone.disputeFlag = true;
    milestone.dispute = {
      createdBy: userId,
      createdAt: new Date(),
      reason,
      description,
      evidence: evidence || [],
      status: 'open',
      role: isMarketer ? 'marketer' : 'creator'
    };

    // Pause any scheduled automatic releases
    milestone.autoReleaseDate = null;
    milestone.releaseScheduled = false;

    // Update deal status
    deal.status = 'disputed';
    
    await deal.save();

    // Notify both parties
    await sendDisputeNotifications(deal, milestone, 'created');

    return res.json({
      success: true,
      message: 'Dispute created successfully',
      dispute: milestone.dispute
    });

  } catch (error) {
    console.error('Error creating dispute:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Resolve a dispute
exports.resolveDispute = async (req, res) => {
  try {
    const { dealId, milestoneId } = req.params;
    const { resolution, releaseAmount, notes } = req.body;

    const deal = await Deal.findById(dealId).populate([
      { path: 'marketerId', select: 'name email' },
      { path: 'creatorId', select: 'name email' }
    ]);

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const milestone = deal.milestones.id(milestoneId);
    if (!milestone || !milestone.disputeFlag) {
      return res.status(404).json({ error: 'No active dispute found' });
    }

    // Update dispute status
    milestone.dispute.status = 'resolved';
    milestone.dispute.resolution = resolution;
    milestone.dispute.resolvedAt = new Date();
    milestone.dispute.resolvedBy = req.user?._id;
    milestone.dispute.resolutionNotes = notes;

    // Remove dispute flag
    milestone.disputeFlag = false;

    // Handle resolution
    if (resolution === 'release_full') {
      // Release full payment to creator
      const releaseResult = await processPaymentRelease(deal, milestone);
      if (releaseResult.success) {
        milestone.status = 'completed';
        milestone.completedAt = new Date();
        deal.paymentInfo.totalReleased += milestone.amount;
      }
    } else if (resolution === 'release_partial') {
      // Release partial payment
      if (releaseAmount && releaseAmount > 0 && releaseAmount <= milestone.amount) {
        const partialPayment = {
          ...milestone.toObject(),
          amount: releaseAmount
        };
        const releaseResult = await processPaymentRelease(deal, partialPayment);
        if (releaseResult.success) {
          milestone.status = 'completed';
          milestone.completedAt = new Date();
          milestone.dispute.releasedAmount = releaseAmount;
          deal.paymentInfo.totalReleased += releaseAmount;
        }
      }
    } else if (resolution === 'refund') {
      // Refund to marketer
      milestone.status = 'refunded';
      milestone.refundedAt = new Date();
    }

    // Update deal status
    const hasActiveDisputes = deal.milestones.some(m => m.disputeFlag);
    if (!hasActiveDisputes) {
      deal.status = 'active';
    }

    await deal.save();

    // Notify both parties
    await sendDisputeNotifications(deal, milestone, 'resolved');

    return res.json({
      success: true,
      message: 'Dispute resolved successfully',
      resolution: milestone.dispute
    });

  } catch (error) {
    console.error('Error resolving dispute:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Send dispute notifications
const sendDisputeNotifications = async (deal, milestone, action) => {
  try {
    const actionMessages = {
      created: `A dispute has been created for milestone "${milestone.name}" in deal "${deal.dealName}"`,
      resolved: `The dispute for milestone "${milestone.name}" in deal "${deal.dealName}" has been resolved`
    };

    const message = actionMessages[action] || 'Dispute status updated';

    // Notify both marketer and creator
    for (const user of [deal.marketerId, deal.creatorId]) {
      if (user.deviceToken) {
        await sendNotification({
          token: user.deviceToken,
          title: `Dispute ${action === 'created' ? 'Created' : 'Resolved'}`,
          body: message,
          data: {
            type: `dispute_${action}`,
            dealId: deal._id.toString(),
            milestoneId: milestone._id.toString()
          }
        });
      }

      await Notification.create({
        userId: user._id,
        type: `dispute_${action}`,
        title: `Dispute ${action === 'created' ? 'Created' : 'Resolved'}`,
        message,
        metadata: {
          dealId: deal._id,
          milestoneId: milestone._id,
          disputeId: milestone.dispute?._id
        }
      });
    }
  } catch (error) {
    console.error('Error sending dispute notifications:', error);
  }
};

// Get automatic release schedule
exports.getAutomaticReleaseSchedule = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const userId = req.user?._id;

    const query = {
      $or: [
        { marketerId: userId },
        { creatorId: userId }
      ],
      'milestones.autoReleaseDate': { $exists: true }
    };

    if (status === 'pending') {
      query['milestones.status'] = { $in: ['approved', 'funded'] };
      query['milestones.releaseScheduled'] = false;
    }

    const deals = await Deal.find(query)
      .populate('marketerId creatorId', 'name')
      .select('dealName dealNumber milestones paymentInfo');

    const schedule = [];

    for (const deal of deals) {
      for (const milestone of deal.milestones) {
        if (milestone.autoReleaseDate && 
            (status === 'all' || 
             (status === 'pending' && !milestone.releaseScheduled && ['approved', 'funded'].includes(milestone.status)))) {
          schedule.push({
            dealId: deal._id,
            dealName: deal.dealName,
            dealNumber: deal.dealNumber,
            milestoneId: milestone._id,
            milestoneName: milestone.name,
            amount: milestone.amount,
            currency: deal.paymentInfo.currency,
            status: milestone.status,
            autoReleaseDate: milestone.autoReleaseDate,
            daysUntilRelease: Math.ceil((new Date(milestone.autoReleaseDate) - new Date()) / (1000 * 60 * 60 * 24)),
            isOverdue: new Date() > new Date(milestone.autoReleaseDate),
            hasDispute: milestone.disputeFlag
          });
        }
      }
    }

    // Sort by release date
    schedule.sort((a, b) => new Date(a.autoReleaseDate) - new Date(b.autoReleaseDate));

    return res.json({
      schedule,
      summary: {
        total: schedule.length,
        pending: schedule.filter(s => !s.isOverdue && !s.hasDispute).length,
        overdue: schedule.filter(s => s.isOverdue && !s.hasDispute).length,
        disputed: schedule.filter(s => s.hasDispute).length,
        totalAmount: schedule.reduce((sum, s) => sum + s.amount, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching release schedule:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper to format currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

module.exports = exports;