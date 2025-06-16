const cron = require('node-cron');
const Deal = require('../models/deal');
const Earning = require('../models/earnings');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * Automatic Milestone Payment Release Job
 * 
 * Runs every hour to check for milestones that should be automatically released:
 * - Funded milestones past their auto-release date
 * - Milestones marked for scheduled release
 * - Overdue milestones meeting release criteria
 */

const processAutomaticMilestoneReleases = async () => {
  try {
    console.log('🔄 Starting automatic milestone release check...');

    // Find deals with funded milestones past auto-release date
    const currentTime = new Date();
    
    const dealsWithOverdueMilestones = await Deal.find({
      'milestones.status': 'funded',
      'milestones.autoReleaseDate': { $lte: currentTime },
      'milestones.releaseScheduled': { $ne: false }
    }).populate('creatorId', 'userName email')
      .populate('marketerId', 'userName email');

    let processedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const deal of dealsWithOverdueMilestones) {
      try {
        // Process each overdue milestone in the deal
        for (const milestone of deal.milestones) {
          if (milestone.status === 'funded' && 
              new Date(milestone.autoReleaseDate) <= currentTime &&
              milestone.releaseScheduled !== false) {
            
            console.log(`Processing automatic release for milestone ${milestone.name} in deal ${deal.dealNumber}`);

            // Find the escrowed earning
            const escrowedEarning = await Earning.findOne({
              deal: deal._id,
              'metadata.milestoneId': milestone._id.toString(),
              status: 'escrowed'
            });

            if (!escrowedEarning) {
              console.error(`No escrowed earning found for milestone ${milestone._id} in deal ${deal._id}`);
              continue;
            }

            // Release the payment
            escrowedEarning.status = 'completed';
            escrowedEarning.releasedAt = new Date();
            escrowedEarning.releaseType = 'automatic';
            escrowedEarning.releaseReason = 'Automatic release - deadline reached';
            await escrowedEarning.save();

            // Update milestone status
            milestone.status = 'completed';
            milestone.completedAt = new Date();
            milestone.releaseScheduled = false;

            // Update deal transaction
            const transaction = deal.paymentInfo?.transactions?.find(t => 
              t.milestoneId?.toString() === milestone._id.toString()
            );
            if (transaction) {
              transaction.status = 'Completed';
              transaction.releasedAt = new Date();
              transaction.releaseType = 'automatic';
            }

            // Send notifications
            await sendAutomaticReleaseNotifications(deal, milestone, escrowedEarning.amount);

            processedCount++;
            console.log(`✅ Automatically released milestone ${milestone.name} for $${escrowedEarning.amount}`);
          }
        }

        // Save deal changes
        deal.markModified('milestones');
        deal.markModified('paymentInfo');
        await deal.save();

        // Check if all milestones are completed
        const allMilestonesCompleted = deal.milestones.every(m => 
          m.status === 'completed' || m.status === 'cancelled'
        );
        
        if (allMilestonesCompleted && deal.status === 'active') {
          deal.status = 'completed';
          await deal.save();
          console.log(`🏁 Deal ${deal.dealNumber} marked as completed - all milestones done`);
          
          // Send deal completion notifications
          await sendDealCompletionNotifications(deal);
        }

      } catch (dealError) {
        console.error(`Error processing deal ${deal._id}:`, dealError);
        errors.push({
          dealId: deal._id,
          dealNumber: deal.dealNumber,
          error: dealError.message
        });
        errorCount++;
      }
    }

    // Process scheduled releases (explicit scheduling by marketer)
    const dealsWithScheduledReleases = await Deal.find({
      'milestones.releaseScheduled': true,
      'milestones.status': 'funded'
    }).populate('creatorId', 'userName email')
      .populate('marketerId', 'userName email');

    for (const deal of dealsWithScheduledReleases) {
      try {
        for (const milestone of deal.milestones) {
          if (milestone.releaseScheduled === true && 
              milestone.status === 'funded' &&
              new Date(milestone.autoReleaseDate) <= currentTime) {
            
            console.log(`Processing scheduled release for milestone ${milestone.name} in deal ${deal.dealNumber}`);

            // Same release logic as above
            const escrowedEarning = await Earning.findOne({
              deal: deal._id,
              'metadata.milestoneId': milestone._id.toString(),
              status: 'escrowed'
            });

            if (escrowedEarning) {
              escrowedEarning.status = 'completed';
              escrowedEarning.releasedAt = new Date();
              escrowedEarning.releaseType = 'scheduled';
              escrowedEarning.releaseReason = 'Scheduled automatic release';
              await escrowedEarning.save();

              milestone.status = 'completed';
              milestone.completedAt = new Date();
              milestone.releaseScheduled = false;

              const transaction = deal.paymentInfo?.transactions?.find(t => 
                t.milestoneId?.toString() === milestone._id.toString()
              );
              if (transaction) {
                transaction.status = 'Completed';
                transaction.releasedAt = new Date();
                transaction.releaseType = 'scheduled';
              }

              await sendScheduledReleaseNotifications(deal, milestone, escrowedEarning.amount);
              processedCount++;
            }
          }
        }

        deal.markModified('milestones');
        deal.markModified('paymentInfo');
        await deal.save();

      } catch (dealError) {
        console.error(`Error processing scheduled release for deal ${deal._id}:`, dealError);
        errorCount++;
      }
    }

    // Log summary
    const summary = {
      timestamp: new Date().toISOString(),
      dealsChecked: dealsWithOverdueMilestones.length + dealsWithScheduledReleases.length,
      milestonesReleased: processedCount,
      errors: errorCount,
      errorDetails: errors
    };

    console.log('📊 Automatic milestone release summary:', summary);

    // Send admin notification if there were errors
    if (errorCount > 0) {
      console.error(`⚠️ ${errorCount} errors occurred during automatic milestone release`);
      await sendAdminErrorNotification(summary);
    } else if (processedCount > 0) {
      console.log(`✅ Successfully processed ${processedCount} automatic milestone releases`);
    } else {
      console.log('ℹ️ No milestones required automatic release');
    }

    return summary;

  } catch (error) {
    console.error('❌ Critical error in automatic milestone release job:', error);
    
    // Send critical error notification
    await sendCriticalErrorNotification(error);
    
    throw error;
  }
};

// Notification helper functions
const sendAutomaticReleaseNotifications = async (deal, milestone, amount) => {
  try {
    const notifications = [
      {
        user: deal.creatorId._id,
        type: "milestone_auto_released",
        title: "Milestone Payment Released",
        subtitle: `Payment for milestone "${milestone.name}" has been automatically released. Amount: $${amount}`,
        data: {
          dealId: deal._id.toString(),
          milestoneId: milestone._id.toString(),
          amount: amount.toString(),
          releaseType: "automatic"
        }
      },
      {
        user: deal.marketerId._id,
        type: "milestone_auto_released",
        title: "Milestone Payment Released",
        subtitle: `Payment for milestone "${milestone.name}" has been automatically released to ${deal.creatorId.userName}. Amount: $${amount}`,
        data: {
          dealId: deal._id.toString(),
          milestoneId: milestone._id.toString(),
          amount: amount.toString(),
          releaseType: "automatic"
        }
      }
    ];

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error sending automatic release notifications:', error);
  }
};

const sendScheduledReleaseNotifications = async (deal, milestone, amount) => {
  try {
    const notifications = [
      {
        user: deal.creatorId._id,
        type: "milestone_scheduled_released",
        title: "Scheduled Milestone Payment Released",
        subtitle: `Scheduled payment for milestone "${milestone.name}" has been released. Amount: $${amount}`,
        data: {
          dealId: deal._id.toString(),
          milestoneId: milestone._id.toString(),
          amount: amount.toString(),
          releaseType: "scheduled"
        }
      },
      {
        user: deal.marketerId._id,
        type: "milestone_scheduled_released",
        title: "Scheduled Milestone Payment Released",
        subtitle: `Your scheduled payment for milestone "${milestone.name}" has been released to ${deal.creatorId.userName}. Amount: $${amount}`,
        data: {
          dealId: deal._id.toString(),
          milestoneId: milestone._id.toString(),
          amount: amount.toString(),
          releaseType: "scheduled"
        }
      }
    ];

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error sending scheduled release notifications:', error);
  }
};

const sendDealCompletionNotifications = async (deal) => {
  try {
    const notifications = [
      {
        user: deal.creatorId._id,
        type: "deal_completed",
        title: "Deal Completed",
        subtitle: `Deal "${deal.dealName}" has been completed. All milestone payments have been released.`,
        data: {
          dealId: deal._id.toString(),
          dealNumber: deal.dealNumber
        }
      },
      {
        user: deal.marketerId._id,
        type: "deal_completed",
        title: "Deal Completed",
        subtitle: `Deal "${deal.dealName}" has been completed. All milestone payments have been released to ${deal.creatorId.userName}.`,
        data: {
          dealId: deal._id.toString(),
          dealNumber: deal.dealNumber
        }
      }
    ];

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error sending deal completion notifications:', error);
  }
};

const sendAdminErrorNotification = async (summary) => {
  try {
    // Find admin users (assuming there's an admin role or specific admin user)
    // For now, log the error - in production, send to admin notification system
    console.error('🚨 Admin Alert: Automatic milestone release errors:', summary);
    
    // TODO: Implement admin notification system
    // Could send email, Slack notification, or create admin dashboard alert
  } catch (error) {
    console.error('Error sending admin error notification:', error);
  }
};

const sendCriticalErrorNotification = async (error) => {
  try {
    console.error('🚨 CRITICAL ERROR in milestone release job:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Implement critical error alerting
    // Could integrate with error tracking service (Sentry, etc.)
  } catch (notificationError) {
    console.error('Error sending critical error notification:', notificationError);
  }
};

// Schedule the job to run every hour
const scheduleAutomaticMilestoneReleases = () => {
  console.log('🕐 Scheduling automatic milestone release job...');
  
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running scheduled automatic milestone release check');
    try {
      await processAutomaticMilestoneReleases();
    } catch (error) {
      console.error('Scheduled milestone release job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('✅ Automatic milestone release job scheduled (every hour)');
};

// Export functions for manual execution and testing
module.exports = {
  scheduleAutomaticMilestoneReleases,
  processAutomaticMilestoneReleases
};

// Auto-start scheduling when module is loaded
scheduleAutomaticMilestoneReleases();