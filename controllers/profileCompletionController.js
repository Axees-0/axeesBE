const User = require('../models/User');
const Notification = require('../models/Notification');
const { ObjectId } = require('mongodb');

/**
 * Get profile completion status for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCompletionStatus = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate profile completion
    const completionChecks = {
      basicInfo: {
        completed: !!(user.name && user.username && user.email),
        required: true,
        weight: 25,
        items: [
          { field: 'name', completed: !!user.name, label: 'Full Name' },
          { field: 'username', completed: !!user.username, label: 'Username' },
          { field: 'email', completed: !!user.email, label: 'Email Address' }
        ]
      },
      profileDetails: {
        completed: !!(user.profilePicture && user.bio && user.location),
        required: true,
        weight: 25,
        items: [
          { field: 'profilePicture', completed: !!user.profilePicture, label: 'Profile Picture' },
          { field: 'bio', completed: !!user.bio, label: 'Bio/Description' },
          { field: 'location', completed: !!user.location, label: 'Location' }
        ]
      },
      socialLinks: {
        completed: !!(user.socialLinks && Object.keys(user.socialLinks).length > 0),
        required: false,
        weight: 15,
        items: [
          { field: 'instagram', completed: !!(user.socialLinks?.instagram), label: 'Instagram' },
          { field: 'tiktok', completed: !!(user.socialLinks?.tiktok), label: 'TikTok' },
          { field: 'youtube', completed: !!(user.socialLinks?.youtube), label: 'YouTube' },
          { field: 'twitter', completed: !!(user.socialLinks?.twitter), label: 'Twitter' }
        ]
      },
      accountSetup: {
        completed: !!(user.accountType && user.preferences),
        required: true,
        weight: 20,
        items: [
          { field: 'accountType', completed: !!user.accountType, label: 'Account Type' },
          { field: 'preferences', completed: !!user.preferences, label: 'Preferences Set' },
          { field: 'phoneVerified', completed: !!user.phoneVerified, label: 'Phone Verified' }
        ]
      },
      paymentSetup: {
        completed: !!(user.paymentMethods && user.paymentMethods.length > 0),
        required: false,
        weight: 15,
        items: [
          { field: 'paymentMethod', completed: !!(user.paymentMethods?.length > 0), label: 'Payment Method' },
          { field: 'bankAccount', completed: !!(user.bankAccount), label: 'Bank Account' }
        ]
      }
    };

    // Calculate overall completion percentage
    let totalWeight = 0;
    let completedWeight = 0;

    Object.values(completionChecks).forEach(section => {
      totalWeight += section.weight;
      if (section.completed) {
        completedWeight += section.weight;
      }
    });

    const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

    // Get missing required items
    const missingRequired = [];
    Object.entries(completionChecks).forEach(([sectionKey, section]) => {
      if (section.required && !section.completed) {
        section.items.forEach(item => {
          if (!item.completed) {
            missingRequired.push({
              section: sectionKey,
              field: item.field,
              label: item.label
            });
          }
        });
      }
    });

    // Determine next recommended action
    let nextAction = null;
    if (missingRequired.length > 0) {
      nextAction = {
        type: 'complete_required',
        message: `Complete ${missingRequired[0].label}`,
        field: missingRequired[0].field,
        section: missingRequired[0].section
      };
    } else if (completionPercentage < 100) {
      // Find first incomplete optional section
      const incompleteOptional = Object.entries(completionChecks)
        .find(([key, section]) => !section.required && !section.completed);
      
      if (incompleteOptional) {
        const incompleteItem = incompleteOptional[1].items.find(item => !item.completed);
        nextAction = {
          type: 'complete_optional',
          message: `Add ${incompleteItem.label}`,
          field: incompleteItem.field,
          section: incompleteOptional[0]
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        completionPercentage,
        completionChecks,
        missingRequired: missingRequired.length,
        nextAction,
        isProfileComplete: completionPercentage === 100 && missingRequired.length === 0
      }
    });

  } catch (error) {
    console.error('Error getting completion status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completion status',
      error: error.message
    });
  }
};

/**
 * Update a specific profile field
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProfileField = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { field, value, section } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!field || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Field and value are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update the specific field
    if (section === 'socialLinks') {
      if (!user.socialLinks) {
        user.socialLinks = {};
      }
      user.socialLinks[field] = value;
    } else if (section === 'preferences') {
      if (!user.preferences) {
        user.preferences = {};
      }
      user.preferences[field] = value;
    } else {
      user[field] = value;
    }

    // Mark field as updated
    user.markModified(section || field);
    await user.save();

    // Check if profile is now complete
    const completionResponse = await exports.getCompletionStatus({ user: { userId } }, { 
      status: () => ({ json: (data) => data })
    });

    res.status(200).json({
      success: true,
      message: 'Profile field updated successfully',
      data: {
        field,
        value,
        user: {
          id: user._id,
          [field]: user[field]
        },
        completion: completionResponse.data
      }
    });

  } catch (error) {
    console.error('Error updating profile field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile field',
      error: error.message
    });
  }
};

/**
 * Get profile completion tips and recommendations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCompletionTips = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const tips = [
      {
        category: 'Profile Picture',
        tip: 'Use a clear, professional headshot to increase trust with potential collaborators',
        completed: !!user.profilePicture,
        priority: 'high'
      },
      {
        category: 'Bio',
        tip: 'Write a compelling bio that highlights your expertise and what makes you unique',
        completed: !!user.bio,
        priority: 'high'
      },
      {
        category: 'Social Links',
        tip: 'Connect your social media accounts to showcase your reach and engagement',
        completed: !!(user.socialLinks && Object.keys(user.socialLinks).length > 0),
        priority: 'medium'
      },
      {
        category: 'Verification',
        tip: 'Verify your phone number to build trust and enable all platform features',
        completed: !!user.phoneVerified,
        priority: 'high'
      },
      {
        category: 'Payment Setup',
        tip: 'Add payment methods to receive earnings and make transactions seamlessly',
        completed: !!(user.paymentMethods && user.paymentMethods.length > 0),
        priority: 'medium'
      }
    ];

    // Filter tips to show only incomplete ones
    const incompleteTips = tips.filter(tip => !tip.completed);
    const completedCount = tips.length - incompleteTips.length;

    res.status(200).json({
      success: true,
      data: {
        tips: incompleteTips,
        completedCount,
        totalCount: tips.length,
        completionRate: Math.round((completedCount / tips.length) * 100)
      }
    });

  } catch (error) {
    console.error('Error getting completion tips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completion tips',
      error: error.message
    });
  }
};

/**
 * Mark profile setup as complete
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.markSetupComplete = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify profile is actually complete
    const completionResponse = await exports.getCompletionStatus({ user: { userId } }, { 
      status: () => ({ json: (data) => data })
    });

    if (completionResponse.data.missingRequired > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark setup as complete - required fields are missing',
        data: {
          missingRequired: completionResponse.data.missingRequired,
          nextAction: completionResponse.data.nextAction
        }
      });
    }

    // Mark setup as complete
    user.setupComplete = true;
    user.setupCompletedAt = new Date();
    await user.save();

    // Send welcome notification
    await Notification.create({
      userId: user._id,
      type: 'setup_complete',
      title: 'Profile Setup Complete!',
      message: 'Welcome to Axees! Your profile is now complete and you can start exploring opportunities.',
      data: {
        completionPercentage: completionResponse.data.completionPercentage
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile setup marked as complete',
      data: {
        user: {
          id: user._id,
          setupComplete: user.setupComplete,
          setupCompletedAt: user.setupCompletedAt
        }
      }
    });

  } catch (error) {
    console.error('Error marking setup complete:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark setup complete',
      error: error.message
    });
  }
};