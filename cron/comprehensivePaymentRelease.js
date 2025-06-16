const cron = require('node-cron');
const Deal = require('../models/deal');
const Earning = require('../models/earnings');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * Comprehensive Automatic Payment Release Job
 * 
 * This enhanced cron job handles all types of automatic payment releases:
 * - Standard deal completions with grace periods
 * - Milestone-based releases
 * - Scheduled releases (marketer-defined)
 * - Overdue escrow releases (maximum escrow period exceeded)
 * - Emergency releases (admin-triggered)
 */

// Release rules configuration
const RELEASE_RULES = {
  STANDARD_DEAL: {
    gracePeriodDays: 7,
    maxEscrowDays: 30,
    requiresApproval: false
  },
  MILESTONE_DEAL: {
    gracePeriodDays: 3,
    maxEscrowDays: 14,
    requiresApproval: false
  },
  HIGH_VALUE_DEAL: {
    threshold: 5000,
    gracePeriodDays: 14,
    maxEscrowDays: 45,
    requiresApproval: true
  },
  DISPUTE_RESOLUTION: {
    gracePeriodDays: 1,
    maxEscrowDays: 60,
    requiresApproval: true
  }
};

// Determine which rules apply to a deal
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

// Calculate release date based on completion and rules
const calculateReleaseDate = (completionDate, rules) => {
  const releaseDate = new Date(completionDate);
  releaseDate.setDate(releaseDate.getDate() + rules.gracePeriodDays);
  return releaseDate;
};

// Main processing function
const processComprehensivePaymentReleases = async () => {
  try {
    console.log('🔄 Starting comprehensive automatic payment release check...');

    const currentTime = new Date();
    let processedCount = 0;
    let errorCount = 0;
    const errors = [];
    const releaseStats = {
      standardDeals: 0,
      milestoneDeals: 0,
      scheduledReleases: 0,
      overdueEscrows: 0,
      highValueDeals: 0
    };

    // 1. STANDARD DEAL RELEASES - Completed deals past grace period
    console.log('📋 Processing standard deal releases...');
    
    const completedDeals = await Deal.find({
      status: 'completed',
      completedAt: { $exists: true, $ne: null }
    }).populate('creatorId', 'userName email')
      .populate('marketerId', 'userName email');

    for (const deal of completedDeals) {
      try {
        const rules = getReleaseRules(deal);
        const releaseDate = calculateReleaseDate(deal.completedAt, rules);
        
        if (currentTime >= releaseDate) {
          // Find escrowed earnings for this deal
          const escrowedEarnings = await Earning.find({
            deal: deal._id,
            status: 'escrowed'
          });

          if (escrowedEarnings.length > 0) {
            const totalAmount = deal.paymentInfo?.paymentAmount || 0;
            const releaseType = totalAmount > RELEASE_RULES.HIGH_VALUE_DEAL.threshold ? 'high_value' : 'standard';
            
            const releasedEarnings = await releaseEarnings(
              escrowedEarnings, 
              'automatic_completion', 
              'Deal completed and grace period passed'
            );
            
            if (releasedEarnings.length > 0) {
              await sendAutomaticReleaseNotifications(deal, releasedEarnings, 'automatic_completion');
              processedCount += releasedEarnings.length;
              releaseStats.standardDeals += releasedEarnings.length;
              
              if (totalAmount > RELEASE_RULES.HIGH_VALUE_DEAL.threshold) {
                releaseStats.highValueDeals += releasedEarnings.length;
              }
            }
          }
        }
      } catch (dealError) {
        console.error(`Error processing completed deal ${deal._id}:`, dealError);
        errors.push({ dealId: deal._id, type: 'standard', error: dealError.message });
        errorCount++;
      }
    }

    // 2. MILESTONE-BASED RELEASES - Completed milestones
    console.log('🎯 Processing milestone-based releases...');
    
    const milestoneFundedEarnings = await Earning.find({
      status: 'escrowed',
      'metadata.milestoneId': { $exists: true }
    }).populate('deal');

    for (const earning of milestoneFundedEarnings) {
      try {
        if (earning.deal) {
          const milestone = earning.deal.milestones?.find(m => 
            m._id.toString() === earning.metadata.milestoneId
          );
          
          if (milestone && milestone.status === 'completed') {
            // Check if milestone auto-release date has passed
            if (milestone.autoReleaseDate && currentTime >= new Date(milestone.autoReleaseDate)) {
              const releasedEarnings = await releaseEarnings(
                [earning], 
                'automatic_milestone', 
                `Milestone "${milestone.name}" completed and auto-release date reached`
              );
              
              if (releasedEarnings.length > 0) {
                await sendMilestoneReleaseNotifications(earning.deal, milestone, earning.amount);
                processedCount += releasedEarnings.length;
                releaseStats.milestoneDeals += releasedEarnings.length;
              }
            }
          }
        }
      } catch (milestoneError) {
        console.error(`Error processing milestone earning ${earning._id}:`, milestoneError);
        errors.push({ earningId: earning._id, type: 'milestone', error: milestoneError.message });
        errorCount++;
      }
    }

    // 3. SCHEDULED RELEASES - Marketer-scheduled releases
    console.log('📅 Processing scheduled releases...');
    
    const scheduledEarnings = await Earning.find({
      status: 'escrowed',
      'metadata.scheduledReleaseDate': { $lte: currentTime }
    }).populate('deal');

    for (const earning of scheduledEarnings) {
      try {
        const releasedEarnings = await releaseEarnings(
          [earning], 
          'scheduled', 
          earning.metadata.scheduleReason || 'Scheduled automatic release'
        );
        
        if (releasedEarnings.length > 0) {
          await sendScheduledReleaseNotifications(earning.deal, earning.amount, earning.metadata.scheduledReleaseDate);
          processedCount += releasedEarnings.length;
          releaseStats.scheduledReleases += releasedEarnings.length;
        }
      } catch (scheduledError) {
        console.error(`Error processing scheduled earning ${earning._id}:`, scheduledError);
        errors.push({ earningId: earning._id, type: 'scheduled', error: scheduledError.message });
        errorCount++;
      }
    }

    // 4. OVERDUE ESCROW RELEASES - Maximum escrow period exceeded
    console.log('⏰ Processing overdue escrow releases...');
    
    const allEscrowedEarnings = await Earning.find({
      status: 'escrowed'
    }).populate('deal');

    for (const earning of allEscrowedEarnings) {
      try {
        if (earning.deal) {
          const rules = getReleaseRules(earning.deal);
          const escrowDate = earning.createdAt;
          const daysSinceEscrowed = Math.floor((currentTime - escrowDate) / (1000 * 60 * 60 * 24));
          
          if (daysSinceEscrowed >= rules.maxEscrowDays) {
            // Check if this earning requires approval for high-value deals
            if (rules.requiresApproval) {
              console.log(`⚠️ High-value earning ${earning._id} requires manual approval for release`);
              await sendHighValueReleaseAlert(earning);
              continue;
            }
            
            const releasedEarnings = await releaseEarnings(
              [earning], 
              'overdue_escrow', 
              `Maximum escrow period of ${rules.maxEscrowDays} days exceeded`
            );
            
            if (releasedEarnings.length > 0) {
              await sendOverdueReleaseNotifications(earning.deal, earning.amount, daysSinceEscrowed);
              processedCount += releasedEarnings.length;
              releaseStats.overdueEscrows += releasedEarnings.length;
            }
          }
        }
      } catch (overdueError) {
        console.error(`Error processing overdue earning ${earning._id}:`, overdueError);
        errors.push({ earningId: earning._id, type: 'overdue', error: overdueError.message });
        errorCount++;
      }
    }

    // 5. UPDATE DEAL STATUSES - Mark deals as completed when all payments released
    console.log('🏁 Updating deal completion statuses...');
    
    const activeDeals = await Deal.find({ status: 'active' });
    for (const deal of activeDeals) {
      try {
        const remainingEscrow = await Earning.find({
          deal: deal._id,
          status: 'escrowed'
        });
        
        if (remainingEscrow.length === 0) {
          // All payments released, mark deal as completed
          deal.status = 'completed';
          if (!deal.completedAt) {
            deal.completedAt = new Date();
          }
          await deal.save();
          
          await sendDealCompletionNotifications(deal);
          console.log(`✅ Deal ${deal.dealNumber} marked as completed - all payments released`);
        }
      } catch (dealUpdateError) {
        console.error(`Error updating deal status ${deal._id}:`, dealUpdateError);
      }
    }

    // Summary and reporting
    const summary = {
      timestamp: new Date().toISOString(),
      processedReleases: processedCount,
      errors: errorCount,
      statistics: releaseStats,
      errorDetails: errors
    };

    console.log('📊 Comprehensive payment release summary:', summary);

    // Send admin notifications for significant events
    if (errorCount > 5) {
      await sendAdminErrorAlert(summary);
    }
    
    if (releaseStats.highValueDeals > 0) {
      await sendHighValueReleaseReport(summary);
    }

    return summary;

  } catch (error) {
    console.error('❌ Critical error in comprehensive payment release job:', error);
    await sendCriticalErrorAlert(error);
    throw error;
  }
};

// Helper function to release earnings
const releaseEarnings = async (earnings, releaseType, reason) => {
  const releasedEarnings = [];
  
  for (const earning of earnings) {
    try {
      earning.status = 'completed';
      earning.releasedAt = new Date();
      earning.releaseType = releaseType;
      earning.releaseReason = reason;
      await earning.save();
      
      releasedEarnings.push({
        earningId: earning._id,
        amount: earning.amount,
        releasedAt: earning.releasedAt,
        dealId: earning.deal
      });
      
      console.log(`✅ Released earning ${earning._id}: $${earning.amount} (${releaseType})`);
      
    } catch (releaseError) {
      console.error(`Failed to release earning ${earning._id}:`, releaseError);
    }
  }
  
  return releasedEarnings;
};

// Notification functions
const sendAutomaticReleaseNotifications = async (deal, releasedEarnings, releaseType) => {
  try {
    const totalAmount = releasedEarnings.reduce((sum, e) => sum + e.amount, 0);
    
    await Notification.insertMany([
      {
        user: deal.creatorId._id,
        type: "payment_auto_released",
        title: "Payment Automatically Released",
        subtitle: `$${totalAmount} has been automatically released for deal ${deal.dealNumber}`,
        data: {
          dealId: deal._id.toString(),
          amount: totalAmount.toString(),
          releaseType,
          count: releasedEarnings.length.toString()
        }
      },
      {
        user: deal.marketerId._id,
        type: "payment_auto_released",
        title: "Payment Automatically Released",
        subtitle: `$${totalAmount} has been automatically released to ${deal.creatorId.userName}`,
        data: {
          dealId: deal._id.toString(),
          amount: totalAmount.toString(),
          releaseType,
          count: releasedEarnings.length.toString()
        }
      }
    ]);
  } catch (error) {
    console.error('Error sending automatic release notifications:', error);
  }
};

const sendMilestoneReleaseNotifications = async (deal, milestone, amount) => {
  try {
    await Notification.insertMany([
      {
        user: deal.creatorId._id,
        type: "milestone_auto_released",
        title: "Milestone Payment Released",
        subtitle: `Milestone "${milestone.name}" payment of $${amount} has been automatically released`,
        data: {
          dealId: deal._id.toString(),
          milestoneId: milestone._id.toString(),
          amount: amount.toString()
        }
      },
      {
        user: deal.marketerId._id,
        type: "milestone_auto_released",
        title: "Milestone Payment Released",
        subtitle: `Milestone "${milestone.name}" payment of $${amount} has been automatically released`,
        data: {
          dealId: deal._id.toString(),
          milestoneId: milestone._id.toString(),
          amount: amount.toString()
        }
      }
    ]);
  } catch (error) {
    console.error('Error sending milestone release notifications:', error);
  }
};

const sendScheduledReleaseNotifications = async (deal, amount, scheduledDate) => {
  try {
    await Notification.insertMany([
      {
        user: deal.creatorId._id,
        type: "scheduled_release_completed",
        title: "Scheduled Payment Released",
        subtitle: `Your scheduled payment of $${amount} has been released`,
        data: {
          dealId: deal._id.toString(),
          amount: amount.toString(),
          originalScheduleDate: scheduledDate.toISOString()
        }
      },
      {
        user: deal.marketerId._id,
        type: "scheduled_release_completed",
        title: "Scheduled Payment Released",
        subtitle: `Your scheduled payment of $${amount} has been released to ${deal.creatorId.userName}`,
        data: {
          dealId: deal._id.toString(),
          amount: amount.toString(),
          originalScheduleDate: scheduledDate.toISOString()
        }
      }
    ]);
  } catch (error) {
    console.error('Error sending scheduled release notifications:', error);
  }
};

const sendOverdueReleaseNotifications = async (deal, amount, daysSinceEscrowed) => {
  try {
    await Notification.insertMany([
      {
        user: deal.creatorId._id,
        type: "overdue_release_completed",
        title: "Overdue Payment Released",
        subtitle: `Payment of $${amount} held in escrow for ${daysSinceEscrowed} days has been automatically released`,
        data: {
          dealId: deal._id.toString(),
          amount: amount.toString(),
          daysSinceEscrowed: daysSinceEscrowed.toString()
        }
      },
      {
        user: deal.marketerId._id,
        type: "overdue_release_completed",
        title: "Overdue Payment Released",
        subtitle: `Payment of $${amount} held in escrow for ${daysSinceEscrowed} days has been automatically released`,
        data: {
          dealId: deal._id.toString(),
          amount: amount.toString(),
          daysSinceEscrowed: daysSinceEscrowed.toString()
        }
      }
    ]);
  } catch (error) {
    console.error('Error sending overdue release notifications:', error);
  }
};

const sendDealCompletionNotifications = async (deal) => {
  try {
    await Notification.insertMany([
      {
        user: deal.creatorId._id,
        type: "deal_completed",
        title: "Deal Completed",
        subtitle: `Deal "${deal.dealName}" has been completed. All payments have been released.`,
        data: { dealId: deal._id.toString(), dealNumber: deal.dealNumber }
      },
      {
        user: deal.marketerId._id,
        type: "deal_completed",
        title: "Deal Completed",
        subtitle: `Deal "${deal.dealName}" has been completed. All payments have been released.`,
        data: { dealId: deal._id.toString(), dealNumber: deal.dealNumber }
      }
    ]);
  } catch (error) {
    console.error('Error sending deal completion notifications:', error);
  }
};

const sendHighValueReleaseAlert = async (earning) => {
  try {
    console.log(`🚨 High-value earning requires approval: ${earning._id} ($${earning.amount})`);
    // TODO: Implement admin notification system for high-value releases
  } catch (error) {
    console.error('Error sending high-value release alert:', error);
  }
};

const sendAdminErrorAlert = async (summary) => {
  try {
    console.error('🚨 Admin Alert: High error count in payment releases:', summary);
    // TODO: Implement admin notification system
  } catch (error) {
    console.error('Error sending admin error alert:', error);
  }
};

const sendHighValueReleaseReport = async (summary) => {
  try {
    console.log('💰 High-value release report:', summary);
    // TODO: Implement admin reporting system
  } catch (error) {
    console.error('Error sending high-value release report:', error);
  }
};

const sendCriticalErrorAlert = async (error) => {
  try {
    console.error('🚨 CRITICAL ERROR in payment release system:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    // TODO: Implement critical error alerting (Slack, email, etc.)
  } catch (alertError) {
    console.error('Error sending critical error alert:', alertError);
  }
};

// Schedule the comprehensive payment release job
const scheduleComprehensivePaymentReleases = () => {
  console.log('🕐 Scheduling comprehensive payment release job...');
  
  // Run every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    console.log('⏰ Running scheduled comprehensive payment release check');
    try {
      await processComprehensivePaymentReleases();
    } catch (error) {
      console.error('Scheduled comprehensive payment release job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('✅ Comprehensive payment release job scheduled (every 2 hours)');
};

// Export functions for manual execution and testing
module.exports = {
  scheduleComprehensivePaymentReleases,
  processComprehensivePaymentReleases
};

// Auto-start scheduling when module is loaded
scheduleComprehensivePaymentReleases();