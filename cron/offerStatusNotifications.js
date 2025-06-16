const cron = require('node-cron');
const Deal = require('../models/deal');
const Offer = require('../models/offer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendOfferStatusNotification } = require('../controllers/offerStatusNotificationController');

/**
 * Comprehensive Offer Status Notification Cron Job
 * 
 * This job monitors offer and deal status changes and sends appropriate notifications:
 * - Deal milestone reminders
 * - Overdue payment notifications
 * - Content submission deadlines
 * - Deal completion follow-ups
 * - Trial offer conversion reminders
 */

const processScheduledNotifications = async () => {
  try {
    console.log('🔔 Starting scheduled offer status notifications check...');

    const currentTime = new Date();
    let processedCount = 0;
    let errorCount = 0;

    // 1. MILESTONE DUE SOON REMINDERS (3 days before due date)
    console.log('📅 Checking milestone due soon reminders...');
    
    const upcomingMilestones = await Deal.find({
      status: 'active',
      'milestones.dueDate': {
        $gte: currentTime,
        $lte: new Date(currentTime.getTime() + (3 * 24 * 60 * 60 * 1000)) // 3 days from now
      },
      'milestones.status': { $in: ['pending', 'in_progress'] }
    }).populate('creatorId marketerId');

    for (const deal of upcomingMilestones) {
      try {
        const dueMilestones = deal.milestones.filter(m => {
          const dueDate = new Date(m.dueDate);
          const daysToDue = Math.ceil((dueDate - currentTime) / (1000 * 60 * 60 * 24));
          return daysToDue <= 3 && daysToDue > 0 && ['pending', 'in_progress'].includes(m.status);
        });

        for (const milestone of dueMilestones) {
          const dueDate = new Date(milestone.dueDate);
          const daysRemaining = Math.ceil((dueDate - currentTime) / (1000 * 60 * 60 * 24));

          // Send to creator
          await sendScheduledNotification({
            userId: deal.creatorId._id,
            notificationType: 'MILESTONE_DUE',
            dealId: deal._id,
            data: {
              dealName: deal.dealName,
              milestoneTitle: milestone.name,
              dueDate: dueDate.toISOString(),
              daysRemaining: daysRemaining,
              status: milestone.status,
              recipientName: deal.creatorId.userName
            },
            channels: ['push', 'email'],
            priority: 'medium'
          });

          processedCount++;
        }
      } catch (milestoneError) {
        console.error(`Error processing milestone reminders for deal ${deal._id}:`, milestoneError);
        errorCount++;
      }
    }

    // 2. PAYMENT OVERDUE NOTIFICATIONS (7 days after deal acceptance)
    console.log('💳 Checking overdue payment notifications...');
    
    const overduePaymentDeals = await Deal.find({
      status: 'accepted',
      acceptedAt: {
        $lte: new Date(currentTime.getTime() - (7 * 24 * 60 * 60 * 1000)) // 7 days ago
      }
    }).populate('creatorId marketerId');

    for (const deal of overduePaymentDeals) {
      try {
        // Send to marketer
        await sendScheduledNotification({
          userId: deal.marketerId._id,
          notificationType: 'DEAL_PAYMENT_REQUIRED',
          dealId: deal._id,
          data: {
            dealName: deal.dealName,
            creatorName: deal.creatorId.userName,
            amount: deal.paymentInfo?.paymentAmount || 0,
            dueDate: new Date(deal.acceptedAt.getTime() + (24 * 60 * 60 * 1000)).toISOString()
          },
          channels: ['push', 'email'],
          priority: 'high'
        });

        processedCount++;
      } catch (paymentError) {
        console.error(`Error processing overdue payment for deal ${deal._id}:`, paymentError);
        errorCount++;
      }
    }

    // 3. CONTENT SUBMISSION DEADLINE REMINDERS (2 days before deadline)
    console.log('📝 Checking content submission deadline reminders...');
    
    const contentDeadlines = await Deal.find({
      status: 'active',
      'deliverables.dueDate': {
        $gte: currentTime,
        $lte: new Date(currentTime.getTime() + (2 * 24 * 60 * 60 * 1000)) // 2 days from now
      },
      'deliverables.status': { $in: ['pending', 'in_progress'] }
    }).populate('creatorId marketerId');

    for (const deal of contentDeadlines) {
      try {
        const upcomingDeliverables = deal.deliverables?.filter(d => {
          const dueDate = new Date(d.dueDate);
          const daysToDue = Math.ceil((dueDate - currentTime) / (1000 * 60 * 60 * 24));
          return daysToDue <= 2 && daysToDue > 0 && ['pending', 'in_progress'].includes(d.status);
        }) || [];

        for (const deliverable of upcomingDeliverables) {
          // Send to creator
          await sendScheduledNotification({
            userId: deal.creatorId._id,
            notificationType: 'CONTENT_SUBMISSION_DUE',
            dealId: deal._id,
            data: {
              dealName: deal.dealName,
              contentType: deliverable.type,
              dueDate: new Date(deliverable.dueDate).toISOString(),
              marketerName: deal.marketerId.userName
            },
            channels: ['push', 'email'],
            priority: 'medium'
          });

          processedCount++;
        }
      } catch (contentError) {
        console.error(`Error processing content deadline for deal ${deal._id}:`, contentError);
        errorCount++;
      }
    }

    // 4. TRIAL OFFER CONVERSION REMINDERS (1 day before conversion)
    console.log('🎯 Checking trial offer conversion reminders...');
    
    const trialOffers = await Offer.find({
      'trialDetails.isTrialOffer': true,
      'trialDetails.trialStatus': 'active',
      'trialDetails.autoConvertDate': {
        $gte: currentTime,
        $lte: new Date(currentTime.getTime() + (24 * 60 * 60 * 1000)) // 1 day from now
      }
    }).populate('creatorId marketerId');

    for (const offer of trialOffers) {
      try {
        const convertDate = new Date(offer.trialDetails.autoConvertDate);
        const hoursRemaining = Math.ceil((convertDate - currentTime) / (1000 * 60 * 60));

        // Send to marketer
        await sendScheduledNotification({
          userId: offer.marketerId._id,
          notificationType: 'TRIAL_CONVERSION_REMINDER',
          offerId: offer._id,
          data: {
            offerName: offer.campaignDetails?.campaignName || 'Trial Offer',
            creatorName: offer.creatorId.userName,
            trialAmount: offer.trialDetails.trialAmount,
            fullAmount: offer.trialDetails.fullAmount,
            convertDate: convertDate.toISOString(),
            hoursRemaining: hoursRemaining
          },
          channels: ['push', 'email'],
          priority: 'high'
        });

        processedCount++;
      } catch (trialError) {
        console.error(`Error processing trial conversion reminder for offer ${offer._id}:`, trialError);
        errorCount++;
      }
    }

    // 5. DEAL COMPLETION FOLLOW-UPS (3 days after completion)
    console.log('🏁 Checking deal completion follow-ups...');
    
    const recentlyCompletedDeals = await Deal.find({
      status: 'completed',
      completedAt: {
        $gte: new Date(currentTime.getTime() - (4 * 24 * 60 * 60 * 1000)), // 4 days ago
        $lte: new Date(currentTime.getTime() - (3 * 24 * 60 * 60 * 1000))  // 3 days ago
      }
    }).populate('creatorId marketerId');

    for (const deal of recentlyCompletedDeals) {
      try {
        // Send follow-up to both parties
        const followUpData = {
          dealName: deal.dealName,
          completedAt: deal.completedAt.toISOString(),
          totalAmount: deal.paymentInfo?.paymentAmount || 0,
          duration: Math.ceil((deal.completedAt - deal.createdAt) / (1000 * 60 * 60 * 24))
        };

        await sendScheduledNotification({
          userId: deal.creatorId._id,
          notificationType: 'DEAL_COMPLETED',
          dealId: deal._id,
          data: {
            ...followUpData,
            recipientName: deal.creatorId.userName,
            partnerName: deal.marketerId.userName,
            finalStatus: 'Successfully completed'
          },
          channels: ['push', 'email'],
          priority: 'low'
        });

        await sendScheduledNotification({
          userId: deal.marketerId._id,
          notificationType: 'DEAL_COMPLETED',
          dealId: deal._id,
          data: {
            ...followUpData,
            recipientName: deal.marketerId.userName,
            partnerName: deal.creatorId.userName,
            finalStatus: 'Successfully completed'
          },
          channels: ['push', 'email'],
          priority: 'low'
        });

        processedCount += 2;
      } catch (followUpError) {
        console.error(`Error processing completion follow-up for deal ${deal._id}:`, followUpError);
        errorCount++;
      }
    }

    const summary = {
      timestamp: new Date().toISOString(),
      processedNotifications: processedCount,
      errors: errorCount
    };

    console.log('📊 Scheduled notifications summary:', summary);

    if (errorCount > 10) {
      console.error('⚠️ High error count in scheduled notifications:', summary);
    }

    return summary;

  } catch (error) {
    console.error('❌ Critical error in scheduled notifications job:', error);
    throw error;
  }
};

// Helper function to send scheduled notifications
const sendScheduledNotification = async (notificationData) => {
  try {
    // Create a mock request/response for the controller
    const mockReq = { body: notificationData };
    const mockRes = {
      json: (data) => data,
      status: (code) => ({ json: (data) => data })
    };

    await sendOfferStatusNotification(mockReq, mockRes);
  } catch (error) {
    console.error('Error sending scheduled notification:', error);
    throw error;
  }
};

// Schedule the notifications job
const scheduleOfferStatusNotifications = () => {
  console.log('🕐 Scheduling offer status notifications job...');
  
  // Run every 6 hours to check for scheduled notifications
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Running scheduled offer status notifications check');
    try {
      await processScheduledNotifications();
    } catch (error) {
      console.error('Scheduled offer status notifications job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('✅ Offer status notifications job scheduled (every 6 hours)');
};

// Export functions
module.exports = {
  scheduleOfferStatusNotifications,
  processScheduledNotifications
};

// Auto-start scheduling when module is loaded
scheduleOfferStatusNotifications();