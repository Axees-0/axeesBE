const cron = require('node-cron');
const axios = require('axios');
const Deal = require('../models/deal');

// Run automatic payment release check every hour
const scheduleAutomaticPaymentRelease = () => {
  // Run at the start of every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Running automatic payment release check...', new Date().toISOString());
    
    try {
      // Find deals with pending automatic releases
      const pendingReleases = await Deal.find({
        status: 'active',
        'paymentInfo.automaticRelease.enabled': true,
        'milestones.status': 'approved',
        'milestones.autoReleaseDate': { $lte: new Date() },
        'milestones.releaseScheduled': false,
        'milestones.disputeFlag': false
      }).count();

      if (pendingReleases > 0) {
        console.log(`📊 Found ${pendingReleases} milestones eligible for automatic release`);
        
        // Call the payment release endpoint
        // In production, this would be an internal service call
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const response = await axios.post(`${baseUrl}/api/deals/process-automatic-releases`, {}, {
          headers: {
            'x-internal-service': process.env.INTERNAL_SERVICE_KEY || 'internal-service-key'
          }
        });

        console.log('✅ Automatic payment release completed:', response.data.results);
      } else {
        console.log('ℹ️  No milestones pending automatic release');
      }
    } catch (error) {
      console.error('❌ Error in automatic payment release job:', error.message);
    }
  });

  console.log('🚀 Automatic payment release job scheduled (runs every hour)');
};

// Run a check on startup after a delay to ensure DB connection
setTimeout(async () => {
  try {
    const pendingCount = await Deal.find({
      'milestones.autoReleaseDate': { $lte: new Date() },
      'milestones.releaseScheduled': false,
      'milestones.disputeFlag': false
    }).count();
    
    if (pendingCount > 0) {
      console.log(`⚠️  ${pendingCount} overdue automatic releases found on startup`);
    }
  } catch (error) {
    console.error('Error checking overdue releases on startup:', error);
  }
}, 5000);

module.exports = scheduleAutomaticPaymentRelease;