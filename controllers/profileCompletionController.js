const User = require('../models/User');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');

/**
 * Enhanced Profile Completion Controller
 * Provides comprehensive profile completion tracking, requirements, and guidance
 */

// Get user's profile completion status
exports.getProfileCompletion = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Force recalculation if requested or if stale
    const shouldRecalculate = req.query.recalculate === 'true' || 
      !user.profileCompletion || 
      !user.profileCompletion.lastCalculated ||
      (Date.now() - user.profileCompletion.lastCalculated.getTime()) > 24 * 60 * 60 * 1000; // 24 hours

    if (shouldRecalculate) {
      user.calculateProfileCompletion();
      await user.save();
    }

    const completion = user.profileCompletion;
    
    // Generate next steps recommendations
    const nextSteps = generateNextSteps(user);
    
    // Calculate time to complete estimate
    const timeToComplete = estimateTimeToComplete(completion);
    
    // Get completion milestones
    const milestones = getCompletionMilestones(completion.score);

    const responseData = {
      userId: user._id,
      userType: user.userType,
      overallScore: completion.score,
      isComplete: completion.score >= 95,
      categories: {
        basic: {
          ...completion.requiredFields.basic,
          weight: 30,
          score: Math.round((Object.values(completion.requiredFields.basic.fields || {}).filter(Boolean).length / 
                           Object.keys(completion.requiredFields.basic.fields || {}).length) * 30 || 0)
        },
        roleSpecific: {
          ...completion.requiredFields.roleSpecific,
          weight: 25,
          score: Math.round((Object.values(completion.requiredFields.roleSpecific.fields || {}).filter(Boolean).length / 
                           Math.max(Object.keys(completion.requiredFields.roleSpecific.fields || {}).length, 1)) * 25)
        },
        verification: {
          ...completion.requiredFields.verification,
          weight: 20,
          score: Math.round((Object.values(completion.requiredFields.verification.fields || {}).filter(Boolean).length / 
                           Object.keys(completion.requiredFields.verification.fields || {}).length) * 20 || 0)
        },
        financial: {
          ...completion.requiredFields.financial,
          weight: 15,
          score: Math.round((Object.values(completion.requiredFields.financial.fields || {}).filter(Boolean).length / 
                           Object.keys(completion.requiredFields.financial.fields || {}).length) * 15 || 0)
        },
        preferences: {
          ...completion.requiredFields.preferences,
          weight: 10,
          score: Math.round((Object.values(completion.requiredFields.preferences.fields || {}).filter(Boolean).length / 
                           Object.keys(completion.requiredFields.preferences.fields || {}).length) * 10 || 0)
        }
      },
      nextSteps,
      timeToComplete,
      milestones,
      lastCalculated: completion.lastCalculated,
      notifications: completion.notifications
    };

    return successResponse(res, "Profile completion retrieved successfully", responseData);

  } catch (error) {
    console.error("Error getting profile completion:", error);
    return handleServerError(res, error);
  }
};

// Mark specific steps as completed
exports.markStepCompleted = async (req, res) => {
  try {
    const { userId } = req.params;
    const { stepId, category, field } = req.body;

    if (!userId || !stepId) {
      return errorResponse(res, "User ID and step ID are required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Add step to completed steps if not already there
    if (!user.profileCompletion) {
      user.calculateProfileCompletion();
    }

    if (!user.profileCompletion.completedSteps.includes(stepId)) {
      user.profileCompletion.completedSteps.push(stepId);
    }

    // Update specific field if provided
    if (category && field && user.profileCompletion.requiredFields[category]) {
      if (!user.profileCompletion.requiredFields[category].fields) {
        user.profileCompletion.requiredFields[category].fields = {};
      }
      user.profileCompletion.requiredFields[category].fields[field] = true;
    }

    // Recalculate completion
    const newScore = user.calculateProfileCompletion();
    await user.save();

    // Send achievement notification if reached milestone
    const milestones = [25, 50, 75, 90, 100];
    const achievedMilestone = milestones.find(milestone => 
      newScore >= milestone && (newScore - 10) < milestone
    );

    if (achievedMilestone && user.deviceToken) {
      await createProfileNotification(user, 'milestone', {
        milestone: achievedMilestone,
        score: newScore
      });
    }

    return successResponse(res, "Step marked as completed", {
      stepId,
      newScore,
      isComplete: newScore >= 95,
      achievedMilestone
    });

  } catch (error) {
    console.error("Error marking step completed:", error);
    return handleServerError(res, error);
  }
};

// Get profile completion requirements for a specific user type
exports.getProfileRequirements = async (req, res) => {
  try {
    const { userType } = req.params;

    if (!userType || !['Creator', 'Marketer'].includes(userType)) {
      return errorResponse(res, "Valid user type is required (Creator or Marketer)", 400);
    }

    const requirements = getProfileRequirements(userType);

    return successResponse(res, "Profile requirements retrieved successfully", requirements);

  } catch (error) {
    console.error("Error getting profile requirements:", error);
    return handleServerError(res, error);
  }
};

// Update profile completion notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { enabled, frequency } = req.body;

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    if (!user.profileCompletion) {
      user.calculateProfileCompletion();
    }

    if (typeof enabled === 'boolean') {
      user.profileCompletion.notifications.enabled = enabled;
    }

    if (frequency && ['daily', 'weekly', 'never'].includes(frequency)) {
      user.profileCompletion.notifications.frequency = frequency;
    }

    await user.save();

    return successResponse(res, "Notification settings updated successfully", {
      notifications: user.profileCompletion.notifications
    });

  } catch (error) {
    console.error("Error updating notification settings:", error);
    return handleServerError(res, error);
  }
};

// Get profile completion analytics for admin
exports.getCompletionAnalytics = async (req, res) => {
  try {
    const { userType, timeframe = '30d' } = req.query;

    const matchQuery = { status: 'active' };
    if (userType) matchQuery.userType = userType;

    const timeframeDate = new Date();
    if (timeframe === '7d') {
      timeframeDate.setDate(timeframeDate.getDate() - 7);
    } else if (timeframe === '30d') {
      timeframeDate.setDate(timeframeDate.getDate() - 30);
    } else if (timeframe === '90d') {
      timeframeDate.setDate(timeframeDate.getDate() - 90);
    }

    const analytics = await User.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          averageScore: { $avg: '$profileCompletion.score' },
          completedProfiles: {
            $sum: {
              $cond: [{ $gte: ['$profileCompletion.score', 95] }, 1, 0]
            }
          },
          incompleteProfiles: {
            $sum: {
              $cond: [{ $lt: ['$profileCompletion.score', 95] }, 1, 0]
            }
          },
          scoreDistribution: {
            $push: '$profileCompletion.score'
          }
        }
      }
    ]);

    // Calculate score distribution ranges
    const scoreRanges = {
      '0-25': 0,
      '26-50': 0,
      '51-75': 0,
      '76-95': 0,
      '96-100': 0
    };

    if (analytics[0]?.scoreDistribution) {
      analytics[0].scoreDistribution.forEach(score => {
        const s = score || 0;
        if (s <= 25) scoreRanges['0-25']++;
        else if (s <= 50) scoreRanges['26-50']++;
        else if (s <= 75) scoreRanges['51-75']++;
        else if (s <= 95) scoreRanges['76-95']++;
        else scoreRanges['96-100']++;
      });
    }

    const result = analytics[0] ? {
      totalUsers: analytics[0].totalUsers,
      averageScore: Math.round(analytics[0].averageScore || 0),
      completionRate: analytics[0].totalUsers > 0 ? 
        Math.round((analytics[0].completedProfiles / analytics[0].totalUsers) * 100) : 0,
      completedProfiles: analytics[0].completedProfiles,
      incompleteProfiles: analytics[0].incompleteProfiles,
      scoreDistribution: scoreRanges
    } : {
      totalUsers: 0,
      averageScore: 0,
      completionRate: 0,
      completedProfiles: 0,
      incompleteProfiles: 0,
      scoreDistribution: scoreRanges
    };

    return successResponse(res, "Profile completion analytics retrieved successfully", result);

  } catch (error) {
    console.error("Error getting completion analytics:", error);
    return handleServerError(res, error);
  }
};

// Send profile completion reminder
exports.sendCompletionReminder = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'gentle' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    if (!user.profileCompletion) {
      user.calculateProfileCompletion();
      await user.save();
    }

    await createProfileNotification(user, 'reminder', {
      type,
      score: user.profileCompletion.score
    });

    // Update last sent timestamp
    user.profileCompletion.notifications.lastSent = new Date();
    await user.save();

    return successResponse(res, "Profile completion reminder sent successfully", {
      reminderType: type,
      currentScore: user.profileCompletion.score
    });

  } catch (error) {
    console.error("Error sending completion reminder:", error);
    return handleServerError(res, error);
  }
};

// Helper Functions

function generateNextSteps(user) {
  const completion = user.profileCompletion;
  const steps = [];

  // Basic information steps
  if (!completion.requiredFields.basic.completed) {
    const basicFields = completion.requiredFields.basic.fields || {};
    
    if (!basicFields.name) {
      steps.push({
        id: 'add_name',
        category: 'basic',
        title: 'Add Your Name',
        description: 'Help others know who you are',
        priority: 'high',
        estimatedTime: '1 minute',
        points: 6
      });
    }
    
    if (!basicFields.bio) {
      steps.push({
        id: 'add_bio',
        category: 'basic',
        title: 'Write Your Bio',
        description: 'Tell your story and what makes you unique',
        priority: 'high',
        estimatedTime: '5 minutes',
        points: 6
      });
    }
    
    if (!basicFields.avatar) {
      steps.push({
        id: 'upload_avatar',
        category: 'basic',
        title: 'Upload Profile Picture',
        description: 'Add a professional photo',
        priority: 'high',
        estimatedTime: '2 minutes',
        points: 6
      });
    }
  }

  // Role-specific steps
  if (!completion.requiredFields.roleSpecific.completed) {
    if (user.userType === 'Creator') {
      const roleFields = completion.requiredFields.roleSpecific.fields || {};
      
      if (!roleFields.categories) {
        steps.push({
          id: 'select_categories',
          category: 'roleSpecific',
          title: 'Select Your Content Categories',
          description: 'Help brands find you for relevant collaborations',
          priority: 'high',
          estimatedTime: '3 minutes',
          points: 5
        });
      }
      
      if (!roleFields.platforms) {
        steps.push({
          id: 'add_social_platforms',
          category: 'roleSpecific',
          title: 'Connect Social Media Accounts',
          description: 'Link your social media profiles',
          priority: 'high',
          estimatedTime: '5 minutes',
          points: 5
        });
      }
      
      if (!roleFields.rates) {
        steps.push({
          id: 'set_rates',
          category: 'roleSpecific',
          title: 'Set Your Rates',
          description: 'Define your pricing for sponsored content',
          priority: 'medium',
          estimatedTime: '10 minutes',
          points: 5
        });
      }
    } else if (user.userType === 'Marketer') {
      const roleFields = completion.requiredFields.roleSpecific.fields || {};
      
      if (!roleFields.brandName) {
        steps.push({
          id: 'add_brand_name',
          category: 'roleSpecific',
          title: 'Add Your Brand Name',
          description: 'Let creators know which brand you represent',
          priority: 'high',
          estimatedTime: '1 minute',
          points: 5
        });
      }
      
      if (!roleFields.industry) {
        steps.push({
          id: 'select_industry',
          category: 'roleSpecific',
          title: 'Select Your Industry',
          description: 'Help creators understand your brand better',
          priority: 'high',
          estimatedTime: '2 minutes',
          points: 5
        });
      }
    }
  }

  // Verification steps
  if (!completion.requiredFields.verification.completed) {
    const verificationFields = completion.requiredFields.verification.fields || {};
    
    if (!verificationFields.emailVerified) {
      steps.push({
        id: 'verify_email',
        category: 'verification',
        title: 'Verify Your Email',
        description: 'Confirm your email address for security',
        priority: 'high',
        estimatedTime: '2 minutes',
        points: 10
      });
    }
  }

  // Financial steps
  if (!completion.requiredFields.financial.completed) {
    const financialFields = completion.requiredFields.financial.fields || {};
    
    if (!financialFields.stripeConnected) {
      steps.push({
        id: 'connect_stripe',
        category: 'financial',
        title: 'Setup Payment Account',
        description: 'Connect Stripe to receive payments',
        priority: 'medium',
        estimatedTime: '10 minutes',
        points: 7
      });
    }
  }

  // Sort by priority and return top 5
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return steps
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    .slice(0, 5);
}

function estimateTimeToComplete(completion) {
  const remainingPoints = 100 - completion.score;
  const averageTimePerPoint = 2; // minutes
  
  return {
    totalMinutes: remainingPoints * averageTimePerPoint,
    formattedTime: formatTime(remainingPoints * averageTimePerPoint),
    remainingSteps: Math.ceil(remainingPoints / 5) // Assuming 5 points per step on average
  };
}

function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
}

function getCompletionMilestones(currentScore) {
  const milestones = [
    { score: 25, title: 'Getting Started', reward: 'Profile visibility boost', achieved: currentScore >= 25 },
    { score: 50, title: 'Halfway There', reward: 'Enhanced search ranking', achieved: currentScore >= 50 },
    { score: 75, title: 'Almost Complete', reward: 'Priority in recommendations', achieved: currentScore >= 75 },
    { score: 90, title: 'Profile Expert', reward: 'Verified badge eligibility', achieved: currentScore >= 90 },
    { score: 100, title: 'Profile Complete', reward: 'Maximum visibility & features', achieved: currentScore >= 100 }
  ];

  return milestones.map(milestone => ({
    ...milestone,
    isNext: !milestone.achieved && currentScore < milestone.score && 
            (currentScore >= (milestone.score - 25) || milestone.score === 25)
  }));
}

function getProfileRequirements(userType) {
  const baseRequirements = {
    basic: {
      title: 'Basic Information',
      weight: 30,
      fields: [
        { id: 'name', title: 'Full Name', required: true },
        { id: 'email', title: 'Email Address', required: true },
        { id: 'phone', title: 'Phone Number', required: true },
        { id: 'bio', title: 'Bio/Description', required: true },
        { id: 'avatar', title: 'Profile Picture', required: true }
      ]
    },
    verification: {
      title: 'Account Verification',
      weight: 20,
      fields: [
        { id: 'emailVerified', title: 'Email Verification', required: true },
        { id: 'phoneVerified', title: 'Phone Verification', required: false }
      ]
    },
    financial: {
      title: 'Payment Setup',
      weight: 15,
      fields: [
        { id: 'stripeConnected', title: 'Payment Account (Stripe)', required: true },
        { id: 'paymentMethodAdded', title: 'Payment Method', required: false }
      ]
    },
    preferences: {
      title: 'Preferences & Settings',
      weight: 10,
      fields: [
        { id: 'settingsConfigured', title: 'Notification Settings', required: false },
        { id: 'categoriesSelected', title: 'Interest Categories', required: true }
      ]
    }
  };

  if (userType === 'Creator') {
    baseRequirements.roleSpecific = {
      title: 'Creator Profile',
      weight: 25,
      fields: [
        { id: 'handleName', title: 'Handle/Username', required: true },
        { id: 'categories', title: 'Content Categories', required: true },
        { id: 'platforms', title: 'Social Media Platforms', required: true },
        { id: 'portfolio', title: 'Portfolio/Samples', required: false },
        { id: 'rates', title: 'Pricing Information', required: false }
      ]
    };
  } else if (userType === 'Marketer') {
    baseRequirements.roleSpecific = {
      title: 'Brand Profile',
      weight: 25,
      fields: [
        { id: 'brandName', title: 'Brand Name', required: true },
        { id: 'brandWebsite', title: 'Brand Website', required: false },
        { id: 'industry', title: 'Industry', required: true },
        { id: 'brandDescription', title: 'Brand Description', required: true },
        { id: 'budget', title: 'Typical Budget Range', required: false }
      ]
    };
  }

  return baseRequirements;
}

async function createProfileNotification(user, type, data) {
  let title, message;
  
  switch (type) {
    case 'milestone':
      title = `🎉 Profile Milestone Reached!`;
      message = `Congratulations! You've reached ${data.milestone}% profile completion. ${getMilestoneReward(data.milestone)}`;
      break;
    case 'reminder':
      if (data.type === 'gentle') {
        title = 'Complete Your Profile';
        message = `Your profile is ${data.score}% complete. A few more steps will unlock better visibility!`;
      } else {
        title = 'Profile Completion Required';
        message = `Complete your profile to access all features. Current progress: ${data.score}%`;
      }
      break;
    default:
      return;
  }

  const notification = new Notification({
    userId: user._id,
    type: 'profile_completion',
    title,
    message,
    data: {
      profileScore: data.score,
      notificationType: type,
      ...data
    }
  });

  await notification.save();

  // Send push notification if user has device token
  if (user.deviceToken) {
    try {
      const { sendPushNotification } = require('../utils/pushNotifications');
      await sendPushNotification(user.deviceToken, title, message, {
        targetScreen: 'Profile',
        userId: user._id
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }
}

function getMilestoneReward(milestone) {
  const rewards = {
    25: 'Your profile gets better visibility in search results.',
    50: 'You now appear higher in creator/marketer recommendations.',
    75: 'You get priority placement in discovery feeds.',
    90: 'You\'re eligible for a verified badge.',
    100: 'You unlock all platform features and maximum visibility!'
  };
  
  return rewards[milestone] || 'Keep up the great work!';
}

module.exports = exports;