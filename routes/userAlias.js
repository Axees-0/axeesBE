const express = require('express');
const router = express.Router();

// Import the existing route handlers
const accountRoutes = require('./account');
const usersRoutes = require('./users');
const profileRoutes = require('./profileRoutes');

/**
 * User Alias Routes
 * These routes provide compatibility aliases for frontend expectations
 * /api/user/* -> consolidates /api/account/*, /api/users/*, and /api/profile/*
 */

// Profile management (frontend expects: GET /api/user/profile)
router.get('/profile', (req, res, next) => {
  // Redirect to profile routes
  req.url = '/';
  profileRoutes(req, res, next);
});

// Update profile (frontend expects: PUT /api/user/profile)
router.put('/profile', (req, res, next) => {
  // Redirect to profile update
  req.url = '/';
  profileRoutes(req, res, next);
});

// Get public profile (frontend expects: GET /api/user/:id)
router.get('/:id', (req, res, next) => {
  // Check if this is a specific user profile request
  if (req.params.id && req.params.id !== 'stats' && req.params.id !== 'social-links') {
    // Redirect to public profile view
    req.url = `/${req.params.id}`;
    profileRoutes(req, res, next);
  } else {
    next();
  }
});

// Upload avatar (frontend expects: POST /api/user/avatar)
router.post('/avatar', (req, res, next) => {
  // Redirect to avatar upload
  req.url = '/avatar';
  profileRoutes(req, res, next);
});

// Delete avatar (frontend expects: DELETE /api/user/avatar)
router.delete('/avatar', (req, res, next) => {
  // Redirect to avatar delete
  req.url = '/avatar';
  profileRoutes(req, res, next);
});

// Update name (frontend expects: POST /api/user/update-name)
router.post('/update-name', (req, res, next) => {
  // Redirect to account name update
  req.url = '/update-name';
  accountRoutes(req, res, next);
});

// Update username (frontend expects: POST /api/user/update-username)
router.post('/update-username', (req, res, next) => {
  // Redirect to account username update
  req.url = '/update-username';
  accountRoutes(req, res, next);
});

// Set email (frontend expects: POST /api/user/set-email)
router.post('/set-email', (req, res, next) => {
  // Redirect to account email set
  req.url = '/set-email';
  accountRoutes(req, res, next);
});

// Set password (frontend expects: POST /api/user/set-password)
router.post('/set-password', (req, res, next) => {
  // Redirect to account password set
  req.url = '/set-password';
  accountRoutes(req, res, next);
});

// Update device token (frontend expects: PUT /api/user/device-token)
router.put('/device-token', (req, res, next) => {
  // Extract userId from authenticated user (manualAuth should provide req.user)
  if (req.user && req.user._id) {
    req.url = `/device-token/${req.user._id}`;
    accountRoutes(req, res, next);
  } else {
    res.status(401).json({ success: false, message: 'Authentication required' });
  }
});

// Delete account (frontend expects: DELETE /api/user)
router.delete('/', (req, res, next) => {
  // Extract userId from authenticated user
  if (req.user && req.user._id) {
    req.url = `/${req.user._id}`;
    accountRoutes(req, res, next);
  } else {
    res.status(401).json({ success: false, message: 'Authentication required' });
  }
});

// Toggle favorites (frontend expects: PATCH /api/user/favorites)
router.patch('/favorites', (req, res, next) => {
  // Extract userId from authenticated user
  if (req.user && req.user._id) {
    req.url = `/${req.user._id}/favorites`;
    usersRoutes(req, res, next);
  } else {
    res.status(401).json({ success: false, message: 'Authentication required' });
  }
});

// Creator data update (frontend expects: PUT /api/user/creator)
router.put('/creator', (req, res, next) => {
  // Redirect to profile creator update
  req.url = '/creator';
  profileRoutes(req, res, next);
});

// Marketer data update (frontend expects: PUT /api/user/marketer)
router.put('/marketer', (req, res, next) => {
  // Redirect to profile marketer update
  req.url = '/marketer';
  profileRoutes(req, res, next);
});

// Switch user role (frontend expects: POST /api/user/switch-role)
router.post('/switch-role', async (req, res) => {
  try {
    const { newRole } = req.body;
    const userId = req.user._id || req.user.id;

    if (!newRole || !['Creator', 'Marketer'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be Creator or Marketer'
      });
    }

    // Check if user already has this role
    if (req.user.userType === newRole) {
      return res.status(400).json({
        success: false,
        message: `User is already a ${newRole}`
      });
    }

    // Update user role
    const User = require('../models/User');
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        userType: newRole,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Role switched to ${newRole} successfully`,
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to switch role',
      error: error.message
    });
  }
});

// Get social media links (frontend expects: GET /api/user/social-links)
router.get('/social-links', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const User = require('../models/User');

    const user = await User.findById(userId).select('creatorData.platforms marketerData.platforms userType');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get social links based on user type
    let socialLinks = [];
    
    if (user.userType === 'Creator' && user.creatorData?.platforms) {
      socialLinks = user.creatorData.platforms.map(platform => ({
        platform: platform.platform,
        handle: platform.handle,
        url: platform.url || `https://${platform.platform.toLowerCase()}.com/${platform.handle}`,
        followers: platform.followers || 0
      }));
    } else if (user.userType === 'Marketer' && user.marketerData?.platforms) {
      socialLinks = user.marketerData.platforms.map(platform => ({
        platform: platform.platform,
        handle: platform.handle,
        url: platform.url || `https://${platform.platform.toLowerCase()}.com/${platform.handle}`,
        followers: platform.followers || 0
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        socialLinks,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Get social links error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social links',
      error: error.message
    });
  }
});

// Update social media links (frontend expects: POST /api/user/social-links)
router.post('/social-links', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { socialLinks } = req.body;
    const User = require('../models/User');

    if (!Array.isArray(socialLinks)) {
      return res.status(400).json({
        success: false,
        message: 'socialLinks must be an array'
      });
    }

    // Validate social links format
    const validPlatforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn', 'Twitch', 'Pinterest'];
    
    for (const link of socialLinks) {
      if (!link.platform || !link.handle) {
        return res.status(400).json({
          success: false,
          message: 'Each social link must have platform and handle'
        });
      }
      
      if (!validPlatforms.includes(link.platform)) {
        return res.status(400).json({
          success: false,
          message: `Invalid platform: ${link.platform}. Must be one of: ${validPlatforms.join(', ')}`
        });
      }
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Format platforms data
    const platformsData = socialLinks.map(link => ({
      platform: link.platform,
      handle: link.handle.replace('@', ''), // Remove @ if present
      url: link.url || `https://${link.platform.toLowerCase()}.com/${link.handle.replace('@', '')}`,
      followers: link.followers || 0
    }));

    // Update based on user type
    if (user.userType === 'Creator') {
      if (!user.creatorData) user.creatorData = {};
      user.creatorData.platforms = platformsData;
      user.markModified('creatorData');
    } else if (user.userType === 'Marketer') {
      if (!user.marketerData) user.marketerData = {};
      user.marketerData.platforms = platformsData;
      user.markModified('marketerData');
    } else {
      return res.status(400).json({
        success: false,
        message: 'User must be Creator or Marketer to have social links'
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Social links updated successfully',
      data: {
        socialLinks: platformsData
      }
    });

  } catch (error) {
    console.error('Update social links error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update social links',
      error: error.message
    });
  }
});

// Get user statistics (frontend expects: GET /api/user/stats)
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const User = require('../models/User');
    const Deal = require('../models/deal');
    const mongoose = require('mongoose');

    const user = await User.findById(userId).select('userType createdAt');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get deal statistics
    const dealStats = await Deal.aggregate([
      {
        $match: {
          $or: [
            { creatorId: new mongoose.Types.ObjectId(userId) },
            { marketerId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get total earnings
    const completedDeals = dealStats.find(stat => stat._id === 'completed') || { count: 0, totalValue: 0 };
    
    // Get offers statistics (as creator receiving offers)
    const Offer = require('../models/offer');
    const offerStats = await Offer.aggregate([
      {
        $match: {
          creatorId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate activity metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const recentActivity = await Deal.countDocuments({
      $or: [
        { creatorId: userId },
        { marketerId: userId }
      ],
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Format response
    const stats = {
      profile: {
        userType: user.userType,
        memberSince: user.createdAt,
        daysActive: Math.floor((now - user.createdAt) / (1000 * 60 * 60 * 24))
      },
      deals: {
        total: dealStats.reduce((sum, stat) => sum + stat.count, 0),
        completed: completedDeals.count,
        pending: dealStats.find(stat => stat._id === 'pending')?.count || 0,
        active: dealStats.find(stat => stat._id === 'active')?.count || 0,
        cancelled: dealStats.find(stat => stat._id === 'cancelled')?.count || 0
      },
      earnings: {
        total: completedDeals.totalValue,
        currency: 'USD'
      },
      offers: {
        received: offerStats.reduce((sum, stat) => sum + stat.count, 0),
        accepted: offerStats.find(stat => stat._id === 'accepted')?.count || 0,
        pending: offerStats.find(stat => stat._id === 'pending')?.count || 0,
        rejected: offerStats.find(stat => stat._id === 'rejected')?.count || 0
      },
      activity: {
        recentDeals: recentActivity,
        period: '30 days'
      }
    };

    // Add user-type specific stats
    if (user.userType === 'Creator') {
      const creatorUser = await User.findById(userId).select('creatorData');
      stats.creator = {
        totalFollowers: creatorUser.creatorData?.totalFollowers || 0,
        platforms: creatorUser.creatorData?.platforms?.length || 0,
        categories: creatorUser.creatorData?.categories?.length || 0
      };
    } else if (user.userType === 'Marketer') {
      const marketerUser = await User.findById(userId).select('marketerData');
      stats.marketer = {
        totalFollowers: marketerUser.marketerData?.totalFollowers || 0,
        platforms: marketerUser.marketerData?.platforms?.length || 0,
        categories: marketerUser.marketerData?.categories?.length || 0
      };
    }

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
});

module.exports = router;