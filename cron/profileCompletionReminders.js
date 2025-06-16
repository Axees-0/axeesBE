const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Profile Completion Reminder System
 * Sends periodic reminders to users with incomplete profiles
 */

// Send profile completion reminders
const sendProfileCompletionReminders = async () => {
  try {
    console.log('🔔 Running profile completion reminder job...');

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Find users with incomplete profiles who haven't received reminders recently
    const incompleteUsers = await User.find({
      status: 'active',
      isActive: true,
      $or: [
        { 'profileCompletion.score': { $lt: 95 } },
        { 'profileCompletion.score': { $exists: false } }
      ],
      $or: [
        { 'profileCompletion.notifications.lastSent': { $lt: weekAgo } },
        { 'profileCompletion.notifications.lastSent': { $exists: false } }
      ],
      'profileCompletion.notifications.enabled': { $ne: false },
      'profileCompletion.notifications.frequency': { $ne: 'never' },
      deviceToken: { $exists: true, $ne: null }
    });

    console.log(`📊 Found ${incompleteUsers.length} users for profile completion reminders`);

    let sentCount = 0;
    const batchSize = 50; // Process in batches to avoid overwhelming the system

    for (let i = 0; i < incompleteUsers.length; i += batchSize) {
      const batch = incompleteUsers.slice(i, i + batchSize);
      
      const promises = batch.map(async (user) => {
        try {
          // Calculate current completion if not available
          if (!user.profileCompletion) {
            user.calculateProfileCompletion();
            await user.save();
          }

          const score = user.profileCompletion.score || 0;
          
          // Determine reminder type based on score and time since registration
          const daysSinceRegistration = Math.floor((now - user.createdAt) / (1000 * 60 * 60 * 24));
          let reminderType = 'gentle';
          let title = '';
          let message = '';

          if (score < 25 && daysSinceRegistration > 3) {
            reminderType = 'urgent';
            title = '🚀 Complete Your Profile to Get Started';
            message = `Your profile is only ${score}% complete. Add basic info to start connecting with ${user.userType === 'Creator' ? 'brands' : 'creators'}!`;
          } else if (score < 50 && daysSinceRegistration > 7) {
            reminderType = 'encouraging';
            title = '⭐ You\'re Halfway There!';
            message = `Your profile is ${score}% complete. A few more details will significantly boost your visibility!`;
          } else if (score < 75) {
            reminderType = 'gentle';
            title = '✨ Polish Your Profile';
            message = `Your profile is ${score}% complete. Complete it to unlock all features and better matching!`;
          } else if (score < 95) {
            reminderType = 'final';
            title = '🎯 Almost Perfect!';
            message = `You're ${score}% done! Just a few final touches to achieve 100% profile completion.`;
          }

          // Create notification
          const notification = new Notification({
            userId: user._id,
            type: 'profile_completion_reminder',
            title,
            message,
            data: {
              profileScore: score,
              reminderType,
              daysSinceRegistration
            }
          });

          await notification.save();

          // Send push notification
          try {
            const { sendPushNotification } = require('../utils/pushNotifications');
            await sendPushNotification(user.deviceToken, title, message, {
              targetScreen: 'Profile',
              userId: user._id,
              type: 'profile_completion'
            });

            // Update last sent timestamp
            user.profileCompletion.notifications.lastSent = now;
            await user.save();

            sentCount++;
            
          } catch (pushError) {
            console.error(`Failed to send push notification to user ${user._id}:`, pushError);
          }

        } catch (userError) {
          console.error(`Error processing user ${user._id} for profile completion reminder:`, userError);
        }
      });

      await Promise.allSettled(promises);
      
      // Small delay between batches
      if (i + batchSize < incompleteUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Profile completion reminder job completed. Sent ${sentCount} reminders.`);
    
    // Log summary statistics
    const completionStats = await getProfileCompletionStats();
    console.log('📈 Profile completion statistics:', completionStats);

  } catch (error) {
    console.error('❌ Error in profile completion reminder job:', error);
  }
};

// Get profile completion statistics
const getProfileCompletionStats = async () => {
  try {
    const stats = await User.aggregate([
      { 
        $match: { 
          status: 'active',
          isActive: true 
        } 
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          averageScore: { $avg: { $ifNull: ['$profileCompletion.score', 0] } },
          completeProfiles: {
            $sum: {
              $cond: [
                { $gte: [{ $ifNull: ['$profileCompletion.score', 0] }, 95] },
                1,
                0
              ]
            }
          },
          incompleteProfiles: {
            $sum: {
              $cond: [
                { $lt: [{ $ifNull: ['$profileCompletion.score', 0] }, 95] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      totalUsers: 0,
      averageScore: 0,
      completeProfiles: 0,
      incompleteProfiles: 0
    };
  } catch (error) {
    console.error('Error getting profile completion stats:', error);
    return null;
  }
};

// Send onboarding reminder for new users
const sendOnboardingReminders = async () => {
  try {
    console.log('👋 Running onboarding reminder job...');

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find new users who haven't started their profile
    const newUsers = await User.find({
      status: 'active',
      createdAt: { $gte: sevenDaysAgo, $lte: threeDaysAgo },
      $or: [
        { 'profileCompletion.score': { $lt: 15 } },
        { 'profileCompletion.score': { $exists: false } }
      ],
      deviceToken: { $exists: true, $ne: null }
    });

    console.log(`👶 Found ${newUsers.length} new users for onboarding reminders`);

    for (const user of newUsers) {
      try {
        const daysSinceRegistration = Math.floor((now - user.createdAt) / (1000 * 60 * 60 * 24));
        
        let title = '';
        let message = '';

        if (daysSinceRegistration === 3) {
          title = '🎉 Welcome to Axees!';
          message = `Hi ${user.name || 'there'}! Ready to start connecting? Complete your profile to get discovered by ${user.userType === 'Creator' ? 'brands' : 'creators'}.`;
        } else if (daysSinceRegistration === 7) {
          title = '🚀 Don\'t Miss Out!';
          message = 'Complete your profile this week to start getting matched with amazing opportunities.';
        }

        // Create notification
        const notification = new Notification({
          userId: user._id,
          type: 'onboarding_reminder',
          title,
          message,
          data: {
            daysSinceRegistration,
            userType: user.userType
          }
        });

        await notification.save();

        // Send push notification
        const { sendPushNotification } = require('../utils/pushNotifications');
        await sendPushNotification(user.deviceToken, title, message, {
          targetScreen: 'Onboarding',
          userId: user._id,
          type: 'onboarding'
        });

      } catch (userError) {
        console.error(`Error processing onboarding reminder for user ${user._id}:`, userError);
      }
    }

    console.log(`✅ Onboarding reminder job completed for ${newUsers.length} users.`);

  } catch (error) {
    console.error('❌ Error in onboarding reminder job:', error);
  }
};

// Schedule the cron jobs
console.log('📅 Scheduling profile completion reminder jobs...');

// Run profile completion reminders every Wednesday at 10 AM
cron.schedule('0 10 * * 3', () => {
  sendProfileCompletionReminders();
}, {
  scheduled: true,
  timezone: "America/New_York"
});

// Run onboarding reminders daily at 9 AM
cron.schedule('0 9 * * *', () => {
  sendOnboardingReminders();
}, {
  scheduled: true,
  timezone: "America/New_York"
});

console.log('✅ Profile completion reminder jobs scheduled successfully');

// Export functions for manual testing
module.exports = {
  sendProfileCompletionReminders,
  sendOnboardingReminders,
  getProfileCompletionStats
};