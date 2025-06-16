const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Offer = require('../models/offer');
const Deal = require('../models/deal');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');
const { sendPushNotification } = require('../utils/pushNotifications');

/**
 * Trial Offer Controller
 * Handles $1 trial offers with automatic conversion and payment processing
 */

// Create a trial offer
exports.createTrialOffer = async (req, res) => {
  try {
    const {
      marketerId,
      creatorId,
      offerName,
      description,
      platforms,
      deliverables,
      trialAmount = 1,
      trialDuration = 7,
      fullAmount,
      desiredReviewDate,
      desiredPostDate,
      attachments
    } = req.body;

    // Validate required fields
    if (!marketerId || !creatorId || !offerName || !fullAmount) {
      return errorResponse(res, "Missing required fields", 400);
    }

    // Verify users exist
    const [marketer, creator] = await Promise.all([
      User.findById(marketerId),
      User.findById(creatorId)
    ]);

    if (!marketer || !creator) {
      return errorResponse(res, "Invalid marketer or creator ID", 404);
    }

    // Verify marketer has payment method
    if (!marketer.stripeCustomerId || !marketer.paymentMethods?.length) {
      return errorResponse(res, "Marketer must have a payment method on file for trial offers", 400);
    }

    // Calculate trial end date and auto-convert date
    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate.getTime() + trialDuration * 24 * 60 * 60 * 1000);
    const autoConvertDate = new Date(trialEndDate.getTime() + 24 * 60 * 60 * 1000); // 1 day after trial ends

    // Create trial offer
    const trialOffer = new Offer({
      marketerId,
      creatorId,
      offerType: "trial",
      offerName,
      description,
      platforms,
      deliverables,
      proposedAmount: fullAmount,
      currency: "USD",
      desiredReviewDate,
      desiredPostDate,
      attachments,
      status: "Pending",
      trialDetails: {
        isTrialOffer: true,
        trialAmount,
        trialDuration,
        fullAmount,
        autoConvertDate,
        trialStatus: "pending",
        trialStartDate: null, // Set when creator accepts
        trialEndDate: null,
        paymentIntentId: null,
        remindersSent: []
      }
    });

    await trialOffer.save();

    // Send notification to creator
    await createTrialOfferNotification(creator, marketer, trialOffer, 'new_trial_offer');

    return successResponse(res, "Trial offer created successfully", {
      offer: trialOffer,
      trialInfo: {
        trialAmount: `$${trialAmount}`,
        trialDuration: `${trialDuration} days`,
        fullAmount: `$${fullAmount}`,
        autoConvertDate: autoConvertDate.toISOString()
      }
    });

  } catch (error) {
    console.error("Error creating trial offer:", error);
    return handleServerError(res, error);
  }
};

// Accept trial offer and initiate $1 payment
exports.acceptTrialOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { creatorId } = req.body;

    const offer = await Offer.findById(offerId)
      .populate('marketerId', 'name email stripeCustomerId paymentMethods')
      .populate('creatorId', 'name email stripeConnectId');

    if (!offer) {
      return errorResponse(res, "Offer not found", 404);
    }

    if (offer.offerType !== 'trial' || !offer.trialDetails.isTrialOffer) {
      return errorResponse(res, "This is not a trial offer", 400);
    }

    if (String(offer.creatorId._id) !== creatorId) {
      return errorResponse(res, "Unauthorized to accept this offer", 403);
    }

    if (offer.status !== 'Pending') {
      return errorResponse(res, "Offer has already been processed", 400);
    }

    // Create payment intent for $1 trial
    const paymentIntent = await stripe.paymentIntents.create({
      amount: offer.trialDetails.trialAmount * 100, // Convert to cents
      currency: 'usd',
      customer: offer.marketerId.stripeCustomerId,
      payment_method: offer.marketerId.paymentMethods[0].id,
      description: `Trial payment for offer: ${offer.offerName}`,
      metadata: {
        offerId: offer._id.toString(),
        offerType: 'trial',
        creatorId: offer.creatorId._id.toString(),
        marketerId: offer.marketerId._id.toString()
      },
      confirm: true,
      transfer_data: offer.creatorId.stripeConnectId ? {
        destination: offer.creatorId.stripeConnectId
      } : undefined,
      application_fee_amount: Math.round(offer.trialDetails.trialAmount * 0.1 * 100) // 10% platform fee
    });

    // Update offer with trial details
    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate.getTime() + offer.trialDetails.trialDuration * 24 * 60 * 60 * 1000);

    offer.status = 'Accepted';
    offer.trialDetails.trialStatus = 'active';
    offer.trialDetails.trialStartDate = trialStartDate;
    offer.trialDetails.trialEndDate = trialEndDate;
    offer.trialDetails.paymentIntentId = paymentIntent.id;

    await offer.save();

    // Create deal for trial period
    const deal = new Deal({
      offerId: offer._id,
      marketerId: offer.marketerId._id,
      creatorId: offer.creatorId._id,
      dealName: `Trial: ${offer.offerName}`,
      description: offer.description,
      dealAmount: offer.trialDetails.trialAmount,
      fullAmount: offer.trialDetails.fullAmount,
      status: 'trial_active',
      isTrialDeal: true,
      trialEndDate: trialEndDate,
      milestones: [{
        name: 'Trial Period',
        amount: offer.trialDetails.trialAmount,
        dueDate: trialEndDate,
        status: 'completed',
        paymentStatus: 'paid'
      }]
    });

    await deal.save();

    // Send notifications
    await Promise.all([
      createTrialOfferNotification(offer.marketerId, offer.creatorId, offer, 'trial_accepted'),
      createTrialOfferNotification(offer.creatorId, offer.marketerId, offer, 'trial_started')
    ]);

    // Schedule trial end reminders
    await scheduleTrialReminders(offer);

    return successResponse(res, "Trial offer accepted successfully", {
      offer,
      deal,
      trialInfo: {
        status: 'active',
        startDate: trialStartDate,
        endDate: trialEndDate,
        paymentStatus: paymentIntent.status,
        nextSteps: 'Complete trial deliverables to convert to full deal'
      }
    });

  } catch (error) {
    console.error("Error accepting trial offer:", error);
    return handleServerError(res, error);
  }
};

// Convert trial to full offer
exports.convertTrialToFull = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { initiatedBy, conversionType = 'manual' } = req.body;

    const offer = await Offer.findById(offerId)
      .populate('marketerId', 'name email stripeCustomerId paymentMethods')
      .populate('creatorId', 'name email stripeConnectId');

    if (!offer || offer.offerType !== 'trial') {
      return errorResponse(res, "Trial offer not found", 404);
    }

    if (offer.trialDetails.trialStatus !== 'active') {
      return errorResponse(res, `Cannot convert trial in ${offer.trialDetails.trialStatus} status`, 400);
    }

    // Verify authorization
    if (initiatedBy && 
        String(offer.marketerId._id) !== initiatedBy && 
        String(offer.creatorId._id) !== initiatedBy) {
      return errorResponse(res, "Unauthorized to convert this trial", 403);
    }

    // Calculate remaining amount (full amount - trial amount)
    const remainingAmount = offer.trialDetails.fullAmount - offer.trialDetails.trialAmount;

    // Create payment intent for remaining amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: remainingAmount * 100,
      currency: 'usd',
      customer: offer.marketerId.stripeCustomerId,
      payment_method: offer.marketerId.paymentMethods[0].id,
      description: `Full payment conversion for offer: ${offer.offerName}`,
      metadata: {
        offerId: offer._id.toString(),
        conversionType,
        trialPaymentId: offer.trialDetails.paymentIntentId
      },
      confirm: true,
      transfer_data: offer.creatorId.stripeConnectId ? {
        destination: offer.creatorId.stripeConnectId
      } : undefined,
      application_fee_amount: Math.round(remainingAmount * 0.1 * 100) // 10% platform fee
    });

    // Update offer status
    offer.trialDetails.trialStatus = 'converted';
    offer.trialDetails.conversionDate = new Date();
    offer.status = 'Deal Created';

    await offer.save();

    // Update deal to full status
    const deal = await Deal.findOne({ offerId: offer._id });
    if (deal) {
      deal.status = 'active';
      deal.isTrialDeal = false;
      deal.dealAmount = offer.trialDetails.fullAmount;
      
      // Add full payment milestone
      deal.milestones.push({
        name: 'Full Payment Conversion',
        amount: remainingAmount,
        dueDate: new Date(),
        status: 'completed',
        paymentStatus: 'paid',
        paymentIntentId: paymentIntent.id
      });

      await deal.save();
    }

    // Send notifications
    await Promise.all([
      createTrialOfferNotification(offer.marketerId, offer.creatorId, offer, 'trial_converted'),
      createTrialOfferNotification(offer.creatorId, offer.marketerId, offer, 'trial_converted')
    ]);

    return successResponse(res, "Trial converted to full offer successfully", {
      offer,
      deal,
      conversion: {
        type: conversionType,
        trialAmount: offer.trialDetails.trialAmount,
        fullAmount: offer.trialDetails.fullAmount,
        remainingPaid: remainingAmount,
        paymentStatus: paymentIntent.status
      }
    });

  } catch (error) {
    console.error("Error converting trial to full offer:", error);
    return handleServerError(res, error);
  }
};

// Cancel trial offer
exports.cancelTrialOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId, reason } = req.body;

    const offer = await Offer.findById(offerId)
      .populate('marketerId', 'name email')
      .populate('creatorId', 'name email');

    if (!offer || offer.offerType !== 'trial') {
      return errorResponse(res, "Trial offer not found", 404);
    }

    // Verify authorization
    if (String(offer.marketerId._id) !== userId && String(offer.creatorId._id) !== userId) {
      return errorResponse(res, "Unauthorized to cancel this trial", 403);
    }

    if (['converted', 'cancelled', 'expired'].includes(offer.trialDetails.trialStatus)) {
      return errorResponse(res, `Cannot cancel trial in ${offer.trialDetails.trialStatus} status`, 400);
    }

    // Update offer status
    offer.trialDetails.trialStatus = 'cancelled';
    offer.status = 'Cancelled';

    await offer.save();

    // Update associated deal if exists
    const deal = await Deal.findOne({ offerId: offer._id });
    if (deal) {
      deal.status = 'cancelled';
      await deal.save();
    }

    // Determine who cancelled
    const cancelledBy = String(offer.marketerId._id) === userId ? 'marketer' : 'creator';
    const otherParty = cancelledBy === 'marketer' ? offer.creatorId : offer.marketerId;

    // Send notification to other party
    await createTrialOfferNotification(otherParty, null, offer, 'trial_cancelled', {
      cancelledBy,
      reason
    });

    return successResponse(res, "Trial offer cancelled successfully", {
      offer,
      cancellation: {
        cancelledBy,
        reason,
        cancelledAt: new Date()
      }
    });

  } catch (error) {
    console.error("Error cancelling trial offer:", error);
    return handleServerError(res, error);
  }
};

// Get trial offer statistics
exports.getTrialOfferStats = async (req, res) => {
  try {
    const { userId, userType, timeframe = '30d' } = req.query;

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    const matchQuery = {};
    if (userType === 'marketer') {
      matchQuery.marketerId = userId;
    } else if (userType === 'creator') {
      matchQuery.creatorId = userId;
    } else {
      matchQuery.$or = [{ marketerId: userId }, { creatorId: userId }];
    }

    matchQuery.offerType = 'trial';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (timeframe === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    }

    const trialOffers = await Offer.find({
      ...matchQuery,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const stats = {
      total: trialOffers.length,
      pending: 0,
      active: 0,
      converted: 0,
      cancelled: 0,
      expired: 0,
      conversionRate: 0,
      averageTrialAmount: 0,
      averageFullAmount: 0,
      totalRevenue: 0,
      timeline: []
    };

    let totalTrialAmount = 0;
    let totalFullAmount = 0;

    trialOffers.forEach(offer => {
      stats[offer.trialDetails.trialStatus]++;
      totalTrialAmount += offer.trialDetails.trialAmount;
      totalFullAmount += offer.trialDetails.fullAmount;

      if (offer.trialDetails.trialStatus === 'converted') {
        stats.totalRevenue += offer.trialDetails.fullAmount;
      } else if (offer.trialDetails.trialStatus === 'active') {
        stats.totalRevenue += offer.trialDetails.trialAmount;
      }
    });

    if (stats.total > 0) {
      stats.averageTrialAmount = Math.round(totalTrialAmount / stats.total * 100) / 100;
      stats.averageFullAmount = Math.round(totalFullAmount / stats.total * 100) / 100;
      
      const eligibleForConversion = stats.active + stats.converted + stats.cancelled + stats.expired;
      if (eligibleForConversion > 0) {
        stats.conversionRate = Math.round((stats.converted / eligibleForConversion) * 100);
      }
    }

    return successResponse(res, "Trial offer statistics retrieved successfully", stats);

  } catch (error) {
    console.error("Error getting trial offer stats:", error);
    return handleServerError(res, error);
  }
};

// Get active trials requiring action
exports.getActiveTrials = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find active trials that are ending soon or past trial period
    const activeTrials = await Offer.find({
      $or: [{ marketerId: userId }, { creatorId: userId }],
      offerType: 'trial',
      'trialDetails.trialStatus': 'active',
      $or: [
        { 'trialDetails.trialEndDate': { $lte: threeDaysFromNow } },
        { 'trialDetails.trialEndDate': { $lt: now } }
      ]
    })
    .populate('marketerId', 'name email')
    .populate('creatorId', 'name email')
    .sort({ 'trialDetails.trialEndDate': 1 });

    const trialsWithActions = activeTrials.map(trial => {
      const daysUntilEnd = Math.ceil((trial.trialDetails.trialEndDate - now) / (1000 * 60 * 60 * 24));
      const isExpired = daysUntilEnd < 0;
      
      return {
        offer: trial,
        status: {
          daysRemaining: Math.max(0, daysUntilEnd),
          isExpired,
          requiresAction: isExpired || daysUntilEnd <= 3
        },
        actions: {
          canConvert: true,
          canCancel: !isExpired,
          canExtend: String(trial.marketerId._id) === userId
        },
        recommendation: isExpired 
          ? 'Trial has expired. Convert to full offer or cancel.'
          : daysUntilEnd <= 1 
          ? 'Trial ending soon! Take action to avoid automatic conversion.'
          : 'Review trial progress and prepare for conversion.'
      };
    });

    return successResponse(res, "Active trials retrieved successfully", {
      trials: trialsWithActions,
      summary: {
        total: trialsWithActions.length,
        expiring: trialsWithActions.filter(t => t.status.daysRemaining <= 3 && !t.status.isExpired).length,
        expired: trialsWithActions.filter(t => t.status.isExpired).length
      }
    });

  } catch (error) {
    console.error("Error getting active trials:", error);
    return handleServerError(res, error);
  }
};

// Helper Functions

async function createTrialOfferNotification(recipient, sender, offer, type, additionalData = {}) {
  let title, message, data;

  switch (type) {
    case 'new_trial_offer':
      title = '🎉 New Trial Offer!';
      message = `${sender.name} sent you a $${offer.trialDetails.trialAmount} trial offer for "${offer.offerName}"`;
      data = {
        offerId: offer._id,
        trialAmount: offer.trialDetails.trialAmount,
        fullAmount: offer.trialDetails.fullAmount,
        trialDuration: offer.trialDetails.trialDuration
      };
      break;

    case 'trial_accepted':
      title = '✅ Trial Offer Accepted';
      message = `Your trial offer for "${offer.offerName}" has been accepted!`;
      data = {
        offerId: offer._id,
        dealId: additionalData.dealId
      };
      break;

    case 'trial_started':
      title = '🚀 Trial Period Started';
      message = `Your ${offer.trialDetails.trialDuration}-day trial for "${offer.offerName}" has begun!`;
      data = {
        offerId: offer._id,
        trialEndDate: offer.trialDetails.trialEndDate
      };
      break;

    case 'trial_ending':
      title = '⏰ Trial Ending Soon';
      message = `Your trial for "${offer.offerName}" ends in ${additionalData.daysRemaining} days`;
      data = {
        offerId: offer._id,
        trialEndDate: offer.trialDetails.trialEndDate,
        action: 'review_and_convert'
      };
      break;

    case 'trial_converted':
      title = '🎊 Trial Converted to Full Offer!';
      message = `Congratulations! "${offer.offerName}" is now a full deal worth $${offer.trialDetails.fullAmount}`;
      data = {
        offerId: offer._id,
        fullAmount: offer.trialDetails.fullAmount
      };
      break;

    case 'trial_cancelled':
      title = '❌ Trial Offer Cancelled';
      message = `The trial for "${offer.offerName}" has been cancelled by the ${additionalData.cancelledBy}`;
      data = {
        offerId: offer._id,
        cancelledBy: additionalData.cancelledBy,
        reason: additionalData.reason
      };
      break;

    case 'trial_expired':
      title = '⚠️ Trial Expired';
      message = `The trial period for "${offer.offerName}" has expired. Take action now!`;
      data = {
        offerId: offer._id,
        action: 'convert_or_cancel'
      };
      break;

    default:
      return;
  }

  const notification = new Notification({
    userId: recipient._id,
    type: 'trial_offer',
    title,
    message,
    data: { ...data, ...additionalData }
  });

  await notification.save();

  // Send push notification if recipient has device token
  if (recipient.deviceToken) {
    try {
      await sendPushNotification(recipient.deviceToken, title, message, {
        targetScreen: 'OfferDetails',
        offerId: offer._id,
        notificationType: type
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }
}

async function scheduleTrialReminders(offer) {
  // Schedule reminders at different intervals
  const reminderSchedule = [
    { days: 3, type: 'trial_ending' },
    { days: 1, type: 'trial_ending' },
    { days: 0, type: 'trial_expired' }
  ];

  // This would typically integrate with a job scheduler like Bull or Agenda
  // For now, we'll just log the schedule
  console.log(`Trial reminders scheduled for offer ${offer._id}:`, reminderSchedule);
}

// Background job to handle automatic trial conversions
exports.processTrialConversions = async () => {
  try {
    console.log('🔄 Processing automatic trial conversions...');

    const now = new Date();
    
    // Find trials that should be automatically converted
    const trialsToConvert = await Offer.find({
      offerType: 'trial',
      'trialDetails.trialStatus': 'active',
      'trialDetails.autoConvertDate': { $lte: now }
    })
    .populate('marketerId', 'name email stripeCustomerId paymentMethods')
    .populate('creatorId', 'name email stripeConnectId');

    console.log(`Found ${trialsToConvert.length} trials to auto-convert`);

    for (const offer of trialsToConvert) {
      try {
        // Attempt automatic conversion
        const conversionResult = await exports.convertTrialToFull({
          params: { offerId: offer._id },
          body: { conversionType: 'automatic' }
        }, {
          // Mock response object
          json: (data) => console.log('Auto-conversion result:', data),
          status: () => ({ json: () => {} })
        });

        console.log(`✅ Auto-converted trial offer ${offer._id}`);

      } catch (error) {
        console.error(`❌ Failed to auto-convert trial ${offer._id}:`, error);
        
        // Mark as expired instead
        offer.trialDetails.trialStatus = 'expired';
        await offer.save();

        // Notify both parties
        await Promise.all([
          createTrialOfferNotification(offer.marketerId, offer.creatorId, offer, 'trial_expired'),
          createTrialOfferNotification(offer.creatorId, offer.marketerId, offer, 'trial_expired')
        ]);
      }
    }

    // Process trial reminders
    await processTrialReminders();

    console.log('✅ Trial conversion processing completed');

  } catch (error) {
    console.error('❌ Error in trial conversion job:', error);
  }
};

// Process trial reminders
async function processTrialReminders() {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find active trials needing reminders
    const trialsNeedingReminders = await Offer.find({
      offerType: 'trial',
      'trialDetails.trialStatus': 'active',
      $or: [
        {
          'trialDetails.trialEndDate': { $gte: now, $lte: threeDaysFromNow },
          'trialDetails.remindersSent.type': { $ne: 'trial_ending_3d' }
        },
        {
          'trialDetails.trialEndDate': { $gte: now, $lte: oneDayFromNow },
          'trialDetails.remindersSent.type': { $ne: 'trial_ending_1d' }
        }
      ]
    })
    .populate('marketerId', 'name email deviceToken')
    .populate('creatorId', 'name email deviceToken');

    for (const offer of trialsNeedingReminders) {
      const daysUntilEnd = Math.ceil((offer.trialDetails.trialEndDate - now) / (1000 * 60 * 60 * 24));
      
      let reminderType;
      if (daysUntilEnd <= 1 && !offer.trialDetails.remindersSent.some(r => r.type === 'trial_ending_1d')) {
        reminderType = 'trial_ending_1d';
      } else if (daysUntilEnd <= 3 && !offer.trialDetails.remindersSent.some(r => r.type === 'trial_ending_3d')) {
        reminderType = 'trial_ending_3d';
      }

      if (reminderType) {
        // Send reminders to both parties
        await Promise.all([
          createTrialOfferNotification(offer.marketerId, offer.creatorId, offer, 'trial_ending', {
            daysRemaining: daysUntilEnd
          }),
          createTrialOfferNotification(offer.creatorId, offer.marketerId, offer, 'trial_ending', {
            daysRemaining: daysUntilEnd
          })
        ]);

        // Record reminder sent
        offer.trialDetails.remindersSent.push({
          type: reminderType,
          sentAt: now
        });

        await offer.save();
        console.log(`📧 Sent ${reminderType} reminder for trial ${offer._id}`);
      }
    }

  } catch (error) {
    console.error('Error processing trial reminders:', error);
  }
}

module.exports = exports;