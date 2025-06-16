const cron = require('node-cron');
const { processTrialConversions } = require('../controllers/trialOfferController');

/**
 * Trial Conversion Cron Job
 * Handles automatic conversions and reminders for trial offers
 */

console.log('📅 Scheduling trial conversion jobs...');

// Run trial conversion check every hour
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Running trial conversion check...');
  try {
    await processTrialConversions();
  } catch (error) {
    console.error('❌ Error in trial conversion cron job:', error);
  }
}, {
  scheduled: true,
  timezone: "America/New_York"
});

// Run trial conversion check daily at 10 AM for comprehensive processing
cron.schedule('0 10 * * *', async () => {
  console.log('📊 Running daily trial conversion comprehensive check...');
  try {
    await processTrialConversions();
    
    // Log trial statistics
    const Offer = require('../models/offer');
    const stats = await Offer.aggregate([
      {
        $match: {
          offerType: 'trial',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$trialDetails.trialStatus',
          count: { $sum: 1 },
          totalValue: { $sum: '$trialDetails.fullAmount' }
        }
      }
    ]);

    console.log('📈 Trial offer statistics (last 30 days):', stats);
    
  } catch (error) {
    console.error('❌ Error in daily trial conversion job:', error);
  }
}, {
  scheduled: true,
  timezone: "America/New_York"
});

console.log('✅ Trial conversion jobs scheduled successfully');

// Export for testing
module.exports = {
  processTrialConversions
};