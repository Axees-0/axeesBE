const User = require('../models/User');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');

/**
 * Social Media Controller
 * Handles social media links/platforms for users
 */

// Get all social media platforms for a user
exports.getSocialMediaPlatforms = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('userType creatorData marketerData');
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    let platforms = [];
    let supportedPlatforms = ['instagram', 'youtube', 'facebook', 'tiktok', 'twitter', 'x', 'twitch'];

    // Get platforms based on user type
    if (user.userType === 'Creator' && user.creatorData) {
      platforms = user.creatorData.platforms || [];
    } else if (user.userType === 'Marketer' && user.marketerData) {
      platforms = user.marketerData.platforms || [];
    }

    // Calculate total followers across all platforms
    const totalFollowers = platforms.reduce((total, platform) => {
      return total + (platform.followersCount || 0);
    }, 0);

    // Platform analytics
    const platformAnalytics = platforms.map(platform => ({
      platform: platform.platform,
      handle: platform.handle,
      followersCount: platform.followersCount || 0,
      percentage: totalFollowers > 0 ? Math.round((platform.followersCount / totalFollowers) * 100) : 0,
      isVerified: !!platform.handle && platform.followersCount > 0,
      lastUpdated: platform.lastUpdated || null
    }));

    return successResponse(res, "Social media platforms retrieved successfully", {
      platforms: platformAnalytics,
      totalFollowers,
      connectedPlatforms: platforms.length,
      supportedPlatforms: supportedPlatforms.map(platform => ({
        platform,
        connected: platforms.some(p => p.platform === platform),
        available: true
      })),
      userType: user.userType
    });

  } catch (error) {
    console.error("Error getting social media platforms:", error);
    return handleServerError(res, error);
  }
};

// Add or update a social media platform
exports.addOrUpdatePlatform = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platform, handle, followersCount } = req.body;

    // Validate input
    if (!platform || !handle) {
      return errorResponse(res, "Platform and handle are required", 400);
    }

    const supportedPlatforms = ['instagram', 'youtube', 'facebook', 'tiktok', 'twitter', 'x', 'twitch'];
    if (!supportedPlatforms.includes(platform.toLowerCase())) {
      return errorResponse(res, `Platform must be one of: ${supportedPlatforms.join(', ')}`, 400);
    }

    // Validate followers count
    if (followersCount !== undefined && (followersCount < 0 || !Number.isInteger(followersCount))) {
      return errorResponse(res, "Followers count must be a non-negative integer", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const platformData = {
      platform: platform.toLowerCase(),
      handle: handle.trim(),
      followersCount: followersCount || 0,
      lastUpdated: new Date()
    };

    let platformsArray;
    let dataPath;

    // Determine which data structure to update
    if (user.userType === 'Creator') {
      if (!user.creatorData) {
        user.creatorData = { platforms: [] };
      }
      platformsArray = user.creatorData.platforms;
      dataPath = 'creatorData';
    } else if (user.userType === 'Marketer') {
      if (!user.marketerData) {
        user.marketerData = { platforms: [] };
      }
      platformsArray = user.marketerData.platforms;
      dataPath = 'marketerData';
    } else {
      return errorResponse(res, "Invalid user type", 400);
    }

    // Check if platform already exists
    const existingPlatformIndex = platformsArray.findIndex(p => p.platform === platform.toLowerCase());

    if (existingPlatformIndex !== -1) {
      // Update existing platform
      platformsArray[existingPlatformIndex] = {
        ...platformsArray[existingPlatformIndex],
        ...platformData
      };
      
      await user.save();

      return successResponse(res, "Social media platform updated successfully", {
        platform: platformsArray[existingPlatformIndex],
        action: 'updated',
        totalPlatforms: platformsArray.length
      });
    } else {
      // Add new platform
      platformsArray.push(platformData);
      
      // Update total followers count
      const totalFollowers = platformsArray.reduce((total, p) => total + (p.followersCount || 0), 0);
      if (dataPath === 'creatorData') {
        user.creatorData.totalFollowers = totalFollowers;
      } else {
        user.marketerData.totalFollowers = totalFollowers;
      }

      await user.save();

      return successResponse(res, "Social media platform added successfully", {
        platform: platformData,
        action: 'added',
        totalPlatforms: platformsArray.length,
        totalFollowers
      });
    }

  } catch (error) {
    console.error("Error adding/updating social media platform:", error);
    return handleServerError(res, error);
  }
};

// Remove a social media platform
exports.removePlatform = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platform } = req.params;

    if (!platform) {
      return errorResponse(res, "Platform parameter is required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    let platformsArray;
    let dataPath;

    // Determine which data structure to update
    if (user.userType === 'Creator' && user.creatorData) {
      platformsArray = user.creatorData.platforms;
      dataPath = 'creatorData';
    } else if (user.userType === 'Marketer' && user.marketerData) {
      platformsArray = user.marketerData.platforms;
      dataPath = 'marketerData';
    } else {
      return errorResponse(res, "No social media data found for user", 404);
    }

    // Find and remove the platform
    const platformIndex = platformsArray.findIndex(p => p.platform === platform.toLowerCase());
    
    if (platformIndex === -1) {
      return errorResponse(res, "Platform not found", 404);
    }

    const removedPlatform = platformsArray[platformIndex];
    platformsArray.splice(platformIndex, 1);

    // Update total followers count
    const totalFollowers = platformsArray.reduce((total, p) => total + (p.followersCount || 0), 0);
    if (dataPath === 'creatorData') {
      user.creatorData.totalFollowers = totalFollowers;
    } else {
      user.marketerData.totalFollowers = totalFollowers;
    }

    await user.save();

    return successResponse(res, "Social media platform removed successfully", {
      removedPlatform,
      remainingPlatforms: platformsArray.length,
      totalFollowers
    });

  } catch (error) {
    console.error("Error removing social media platform:", error);
    return handleServerError(res, error);
  }
};

// Get platform analytics and insights
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('userType creatorData marketerData');
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    let platforms = [];
    if (user.userType === 'Creator' && user.creatorData) {
      platforms = user.creatorData.platforms || [];
    } else if (user.userType === 'Marketer' && user.marketerData) {
      platforms = user.marketerData.platforms || [];
    }

    if (platforms.length === 0) {
      return successResponse(res, "No platforms found", {
        analytics: {
          totalFollowers: 0,
          averageFollowers: 0,
          topPlatform: null,
          platforms: [],
          recommendations: [
            "Add your first social media platform to get started",
            "Connect Instagram for better reach",
            "YouTube creators often get higher engagement rates"
          ]
        }
      });
    }

    // Calculate analytics
    const totalFollowers = platforms.reduce((total, p) => total + (p.followersCount || 0), 0);
    const averageFollowers = Math.round(totalFollowers / platforms.length);
    
    // Find top platform
    const topPlatform = platforms.reduce((top, current) => {
      return (current.followersCount || 0) > (top.followersCount || 0) ? current : top;
    }, platforms[0]);

    // Platform distribution
    const platformDistribution = platforms.map(platform => ({
      platform: platform.platform,
      followersCount: platform.followersCount || 0,
      percentage: totalFollowers > 0 ? Math.round((platform.followersCount / totalFollowers) * 100) : 0,
      handle: platform.handle
    }));

    // Generate recommendations
    const recommendations = generateRecommendations(platforms, user.userType);

    // Platform performance tiers
    const performance = categorizePlatformPerformance(platforms);

    return successResponse(res, "Platform analytics retrieved successfully", {
      analytics: {
        totalFollowers,
        averageFollowers,
        topPlatform: {
          platform: topPlatform.platform,
          handle: topPlatform.handle,
          followersCount: topPlatform.followersCount || 0
        },
        platforms: platformDistribution,
        performance,
        recommendations
      },
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error("Error getting platform analytics:", error);
    return handleServerError(res, error);
  }
};

// Bulk update multiple platforms
exports.bulkUpdatePlatforms = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platforms } = req.body;

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return errorResponse(res, "Platforms array is required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const supportedPlatforms = ['instagram', 'youtube', 'facebook', 'tiktok', 'twitter', 'x', 'twitch'];
    const results = {
      updated: [],
      added: [],
      errors: []
    };

    // Validate all platforms first
    for (const [index, platform] of platforms.entries()) {
      if (!platform.platform || !platform.handle) {
        results.errors.push({
          index,
          error: "Platform and handle are required",
          platform: platform.platform || 'unknown'
        });
        continue;
      }

      if (!supportedPlatforms.includes(platform.platform.toLowerCase())) {
        results.errors.push({
          index,
          error: `Unsupported platform: ${platform.platform}`,
          platform: platform.platform
        });
        continue;
      }

      if (platform.followersCount !== undefined && (platform.followersCount < 0 || !Number.isInteger(platform.followersCount))) {
        results.errors.push({
          index,
          error: "Followers count must be a non-negative integer",
          platform: platform.platform
        });
        continue;
      }
    }

    // If there are validation errors, return them
    if (results.errors.length > 0) {
      return errorResponse(res, "Validation errors found", 400, { results });
    }

    // Determine data structure
    let platformsArray;
    let dataPath;

    if (user.userType === 'Creator') {
      if (!user.creatorData) {
        user.creatorData = { platforms: [] };
      }
      platformsArray = user.creatorData.platforms;
      dataPath = 'creatorData';
    } else if (user.userType === 'Marketer') {
      if (!user.marketerData) {
        user.marketerData = { platforms: [] };
      }
      platformsArray = user.marketerData.platforms;
      dataPath = 'marketerData';
    } else {
      return errorResponse(res, "Invalid user type", 400);
    }

    // Process each platform
    for (const platform of platforms) {
      const platformData = {
        platform: platform.platform.toLowerCase(),
        handle: platform.handle.trim(),
        followersCount: platform.followersCount || 0,
        lastUpdated: new Date()
      };

      const existingIndex = platformsArray.findIndex(p => p.platform === platform.platform.toLowerCase());

      if (existingIndex !== -1) {
        // Update existing
        platformsArray[existingIndex] = {
          ...platformsArray[existingIndex],
          ...platformData
        };
        results.updated.push(platformData);
      } else {
        // Add new
        platformsArray.push(platformData);
        results.added.push(platformData);
      }
    }

    // Update total followers
    const totalFollowers = platformsArray.reduce((total, p) => total + (p.followersCount || 0), 0);
    if (dataPath === 'creatorData') {
      user.creatorData.totalFollowers = totalFollowers;
    } else {
      user.marketerData.totalFollowers = totalFollowers;
    }

    await user.save();

    return successResponse(res, "Platforms updated successfully", {
      results,
      totalPlatforms: platformsArray.length,
      totalFollowers
    });

  } catch (error) {
    console.error("Error bulk updating platforms:", error);
    return handleServerError(res, error);
  }
};

// Helper functions
const generateRecommendations = (platforms, userType) => {
  const recommendations = [];
  const connectedPlatforms = platforms.map(p => p.platform);
  
  // Platform-specific recommendations
  if (!connectedPlatforms.includes('instagram')) {
    recommendations.push("Consider adding Instagram - it's highly effective for visual content");
  }
  
  if (!connectedPlatforms.includes('tiktok') && userType === 'Creator') {
    recommendations.push("TikTok offers great opportunities for viral content and younger audiences");
  }
  
  if (!connectedPlatforms.includes('youtube')) {
    recommendations.push("YouTube provides excellent long-form content monetization opportunities");
  }

  // Follower-based recommendations
  const totalFollowers = platforms.reduce((total, p) => total + (p.followersCount || 0), 0);
  
  if (totalFollowers < 1000) {
    recommendations.push("Focus on consistent content creation to grow your follower base");
  } else if (totalFollowers < 10000) {
    recommendations.push("Consider cross-promoting content across platforms to maximize reach");
  } else {
    recommendations.push("Your follower count is strong - focus on engagement and conversion");
  }

  return recommendations.slice(0, 5); // Limit to 5 recommendations
};

const categorizePlatformPerformance = (platforms) => {
  const performance = {
    strong: [],
    moderate: [],
    developing: []
  };

  platforms.forEach(platform => {
    const followers = platform.followersCount || 0;
    
    if (followers >= 10000) {
      performance.strong.push({
        platform: platform.platform,
        handle: platform.handle,
        followersCount: followers
      });
    } else if (followers >= 1000) {
      performance.moderate.push({
        platform: platform.platform,
        handle: platform.handle,
        followersCount: followers
      });
    } else {
      performance.developing.push({
        platform: platform.platform,
        handle: platform.handle,
        followersCount: followers
      });
    }
  });

  return performance;
};

module.exports = exports;