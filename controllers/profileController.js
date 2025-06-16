const User = require('../models/User');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');

/**
 * Profile Controller
 * Handles profile completion tracking, profile updates, and related operations
 */

// Get profile completion status
exports.getProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Calculate current profile completion
    const completionScore = user.calculateProfileCompletion();
    
    // Get missing fields for each category
    const missingFields = {
      basic: [],
      roleSpecific: [],
      verification: [],
      financial: [],
      preferences: []
    };

    // Check basic fields
    if (!user.profileCompletion.requiredFields.basic.completed) {
      const fields = user.profileCompletion.requiredFields.basic.fields;
      for (const [field, completed] of Object.entries(fields)) {
        if (!completed) {
          missingFields.basic.push(field);
        }
      }
    }

    // Check role-specific fields
    if (!user.profileCompletion.requiredFields.roleSpecific.completed) {
      const fields = user.profileCompletion.requiredFields.roleSpecific.fields;
      for (const [field, completed] of Object.entries(fields)) {
        if (!completed) {
          missingFields.roleSpecific.push(field);
        }
      }
    }

    // Check verification fields
    if (!user.profileCompletion.requiredFields.verification.completed) {
      const fields = user.profileCompletion.requiredFields.verification.fields;
      for (const [field, completed] of Object.entries(fields)) {
        if (!completed) {
          missingFields.verification.push(field);
        }
      }
    }

    // Check financial fields
    if (!user.profileCompletion.requiredFields.financial.completed) {
      const fields = user.profileCompletion.requiredFields.financial.fields;
      for (const [field, completed] of Object.entries(fields)) {
        if (!completed) {
          missingFields.financial.push(field);
        }
      }
    }

    // Check preferences fields
    if (!user.profileCompletion.requiredFields.preferences.completed) {
      const fields = user.profileCompletion.requiredFields.preferences.fields;
      for (const [field, completed] of Object.entries(fields)) {
        if (!completed) {
          missingFields.preferences.push(field);
        }
      }
    }

    // Calculate recommendations
    const recommendations = generateProfileRecommendations(user, missingFields);

    return successResponse(res, "Profile completion status retrieved successfully", {
      completionPercentage: completionScore,
      requiredFields: user.profileCompletion.requiredFields,
      missingFields,
      recommendations,
      isComplete: completionScore === 100,
      canSendOffers: user.role === 'marketer' ? completionScore >= 80 : true,
      lastCalculated: user.profileCompletion.lastCalculated
    });

  } catch (error) {
    console.error("Error getting profile completion:", error);
    return handleServerError(res, error);
  }
};

// Update profile with completion tracking
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Apply updates based on user role
    const allowedUpdates = getA llowedUpdates(user.role);
    const validUpdates = {};

    for (const key of allowedUpdates) {
      if (updates.hasOwnProperty(key) && updates[key] !== undefined) {
        if (key.includes('.')) {
          // Handle nested updates
          const [parent, child] = key.split('.');
          if (!validUpdates[parent]) {
            validUpdates[parent] = user[parent] || {};
          }
          validUpdates[parent][child] = updates[key];
        } else {
          validUpdates[key] = updates[key];
        }
      }
    }

    // Apply updates
    Object.assign(user, validUpdates);

    // Recalculate profile completion
    const previousScore = user.profileCompletion.score;
    const newScore = user.calculateProfileCompletion();

    await user.save();

    // Check if profile completion improved
    const completionImproved = newScore > previousScore;
    const isNowComplete = newScore === 100 && previousScore < 100;

    return successResponse(res, "Profile updated successfully", {
      user: {
        id: user._id,
        ...validUpdates,
        profileCompletion: {
          score: newScore,
          previousScore,
          improved: completionImproved,
          isComplete: newScore === 100
        }
      },
      message: isNowComplete ? "Congratulations! Your profile is now complete." : null
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return handleServerError(res, error);
  }
};

// Get profile completion checklist
exports.getProfileChecklist = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const checklist = generateProfileChecklist(user);

    return successResponse(res, "Profile checklist retrieved successfully", {
      checklist,
      totalSteps: checklist.reduce((total, category) => total + category.items.length, 0),
      completedSteps: checklist.reduce((total, category) => 
        total + category.items.filter(item => item.completed).length, 0
      ),
      role: user.role
    });

  } catch (error) {
    console.error("Error getting profile checklist:", error);
    return handleServerError(res, error);
  }
};

// Check if user can perform certain actions based on profile completion
exports.checkProfileRequirements = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const completionScore = user.profileCompletion.score || user.calculateProfileCompletion();
    const requirements = getActionRequirements(action, user.role);

    const canPerformAction = completionScore >= requirements.minimumScore;
    const missingRequirements = [];

    if (!canPerformAction) {
      // Check specific required fields
      for (const field of requirements.requiredFields) {
        const fieldPath = field.split('.');
        let value = user;
        for (const path of fieldPath) {
          value = value?.[path];
        }
        if (!value) {
          missingRequirements.push(field);
        }
      }
    }

    return successResponse(res, "Profile requirements checked successfully", {
      action,
      canPerformAction,
      currentScore: completionScore,
      requiredScore: requirements.minimumScore,
      missingRequirements,
      message: requirements.message
    });

  } catch (error) {
    console.error("Error checking profile requirements:", error);
    return handleServerError(res, error);
  }
};

// Helper functions
const generateProfileRecommendations = (user, missingFields) => {
  const recommendations = [];

  // Basic profile recommendations
  if (missingFields.basic.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'basic',
      title: 'Complete Basic Information',
      description: 'Add your basic profile information to build trust with other users',
      actions: missingFields.basic.map(field => ({
        field,
        label: getFieldLabel(field),
        type: 'update'
      }))
    });
  }

  // Role-specific recommendations
  if (missingFields.roleSpecific.length > 0) {
    const roleTitle = user.role === 'creator' ? 'Creator' : 'Marketer';
    recommendations.push({
      priority: 'high',
      category: 'roleSpecific',
      title: `Complete ${roleTitle} Information`,
      description: `Add ${roleTitle.toLowerCase()}-specific details to attract better opportunities`,
      actions: missingFields.roleSpecific.map(field => ({
        field,
        label: getFieldLabel(field),
        type: 'update'
      }))
    });
  }

  // Verification recommendations
  if (missingFields.verification.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'verification',
      title: 'Verify Your Account',
      description: 'Verify your account to increase trust and unlock more features',
      actions: missingFields.verification.map(field => ({
        field,
        label: getFieldLabel(field),
        type: field === 'emailVerified' ? 'verify' : 'update'
      }))
    });
  }

  // Financial recommendations
  if (missingFields.financial.length > 0) {
    recommendations.push({
      priority: user.role === 'creator' ? 'high' : 'medium',
      category: 'financial',
      title: 'Set Up Payment Methods',
      description: 'Add payment information to start receiving payments',
      actions: missingFields.financial.map(field => ({
        field,
        label: getFieldLabel(field),
        type: 'connect'
      }))
    });
  }

  return recommendations;
};

const generateProfileChecklist = (user) => {
  const checklist = [];

  // Basic Information
  checklist.push({
    category: 'Basic Information',
    weight: 30,
    items: [
      {
        id: 'name',
        label: 'Add your full name',
        completed: !!user.name,
        required: true
      },
      {
        id: 'email',
        label: 'Add email address',
        completed: !!user.email,
        required: true
      },
      {
        id: 'phone',
        label: 'Add phone number',
        completed: !!user.phone,
        required: false
      },
      {
        id: 'bio',
        label: 'Write a bio',
        completed: !!user.bio,
        required: true
      },
      {
        id: 'avatarUrl',
        label: 'Upload profile picture',
        completed: !!user.avatarUrl,
        required: true
      }
    ]
  });

  // Role-specific items
  if (user.role === 'creator') {
    checklist.push({
      category: 'Creator Profile',
      weight: 25,
      items: [
        {
          id: 'socialPlatforms',
          label: 'Connect social media accounts',
          completed: user.creatorData?.socialPlatforms?.length > 0,
          required: true
        },
        {
          id: 'portfolio',
          label: 'Add portfolio items',
          completed: user.creatorData?.portfolio?.length > 0,
          required: true
        },
        {
          id: 'categories',
          label: 'Select content categories',
          completed: user.creatorData?.categories?.length > 0,
          required: true
        },
        {
          id: 'mediaPackage',
          label: 'Upload media package',
          completed: !!user.creatorData?.mediaPackage,
          required: false
        }
      ]
    });
  } else if (user.role === 'marketer') {
    checklist.push({
      category: 'Marketer Profile',
      weight: 25,
      items: [
        {
          id: 'companyName',
          label: 'Add company name',
          completed: !!user.marketerData?.companyName,
          required: true
        },
        {
          id: 'website',
          label: 'Add company website',
          completed: !!user.marketerData?.website,
          required: false
        },
        {
          id: 'industry',
          label: 'Select industry',
          completed: !!user.marketerData?.industry,
          required: true
        },
        {
          id: 'teamSize',
          label: 'Specify team size',
          completed: !!user.marketerData?.teamSize,
          required: false
        }
      ]
    });
  }

  // Verification
  checklist.push({
    category: 'Account Verification',
    weight: 20,
    items: [
      {
        id: 'emailVerified',
        label: 'Verify email address',
        completed: user.emailVerified,
        required: true
      },
      {
        id: 'phoneVerified',
        label: 'Verify phone number',
        completed: user.phoneVerified,
        required: false
      }
    ]
  });

  // Financial Setup
  checklist.push({
    category: 'Payment Setup',
    weight: 15,
    items: [
      {
        id: 'stripeConnected',
        label: user.role === 'creator' ? 'Connect Stripe for payouts' : 'Connect payment method',
        completed: user.role === 'creator' ? !!user.stripeConnectId : user.paymentMethods?.length > 0,
        required: true
      }
    ]
  });

  return checklist;
};

const getAllowedUpdates = (role) => {
  const commonUpdates = [
    'name', 'bio', 'phone', 'avatarUrl', 'settings.notifications', 
    'settings.privacy', 'settings.language', 'settings.timezone'
  ];

  if (role === 'creator') {
    return [
      ...commonUpdates,
      'creatorData.socialPlatforms',
      'creatorData.portfolio',
      'creatorData.categories',
      'creatorData.achievements',
      'creatorData.mediaPackage',
      'creatorData.funFacts',
      'creatorData.nicheTopics',
      'creatorData.businessVentures'
    ];
  } else if (role === 'marketer') {
    return [
      ...commonUpdates,
      'marketerData.companyName',
      'marketerData.website',
      'marketerData.industry',
      'marketerData.teamSize',
      'marketerData.description',
      'marketerData.socialProfiles',
      'marketerData.portfolio'
    ];
  }

  return commonUpdates;
};

const getFieldLabel = (field) => {
  const labels = {
    name: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    bio: 'Bio/Description',
    avatarUrl: 'Profile Picture',
    emailVerified: 'Email Verification',
    phoneVerified: 'Phone Verification',
    socialPlatforms: 'Social Media Accounts',
    portfolio: 'Portfolio Items',
    categories: 'Content Categories',
    companyName: 'Company Name',
    website: 'Website',
    industry: 'Industry',
    stripeConnected: 'Payment Setup',
    paymentMethodAdded: 'Payment Method'
  };

  return labels[field] || field.replace(/([A-Z])/g, ' $1').trim();
};

const getActionRequirements = (action, role) => {
  const requirements = {
    sendOffer: {
      creator: { minimumScore: 0, requiredFields: [], message: 'Creators can receive offers at any profile completion level' },
      marketer: { minimumScore: 80, requiredFields: ['name', 'email', 'marketerData.companyName'], message: 'Complete at least 80% of your profile to send offers' }
    },
    acceptOffer: {
      creator: { minimumScore: 60, requiredFields: ['name', 'email', 'bio'], message: 'Complete at least 60% of your profile to accept offers' },
      marketer: { minimumScore: 0, requiredFields: [], message: 'Marketers can accept counter-offers at any profile completion level' }
    },
    createDeal: {
      creator: { minimumScore: 70, requiredFields: ['stripeConnectId'], message: 'Set up payment method and complete 70% of profile to create deals' },
      marketer: { minimumScore: 80, requiredFields: ['paymentMethods'], message: 'Add payment method and complete 80% of profile to create deals' }
    },
    withdrawFunds: {
      creator: { minimumScore: 90, requiredFields: ['stripeConnectId', 'emailVerified'], message: 'Verify email and complete 90% of profile to withdraw funds' },
      marketer: { minimumScore: 0, requiredFields: [], message: 'Marketers cannot withdraw funds' }
    }
  };

  const actionReq = requirements[action] || { 
    creator: { minimumScore: 0, requiredFields: [], message: 'No specific requirements' },
    marketer: { minimumScore: 0, requiredFields: [], message: 'No specific requirements' }
  };

  return actionReq[role] || actionReq.creator;
};

module.exports = exports;