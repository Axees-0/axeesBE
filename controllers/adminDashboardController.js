const User = require('../models/User');
const Deal = require('../models/Deal');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { ObjectId } = require('mongodb');

/**
 * Get admin dashboard overview statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Verify admin privileges
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get time ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User statistics
    const [totalUsers, newUsersThisMonth, activeUsersThisWeek] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ 
        role: { $ne: 'admin' },
        createdAt: { $gte: startOfMonth }
      }),
      User.countDocuments({
        role: { $ne: 'admin' },
        lastActiveAt: { $gte: startOfWeek }
      })
    ]);

    // Deal statistics
    const [totalDeals, activeDeals, completedDeals, totalDealValue] = await Promise.all([
      Deal.countDocuments(),
      Deal.countDocuments({ status: 'active' }),
      Deal.countDocuments({ status: 'completed' }),
      Deal.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    // Payment statistics
    const [totalPayments, pendingPayments, totalRevenue] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'pending' }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    // User growth over time (last 6 months)
    const userGrowth = await User.aggregate([
      {
        $match: {
          role: { $ne: 'admin' },
          createdAt: { $gte: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Deal completion rate by month
    const dealStats = await Deal.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          users: {
            total: totalUsers,
            newThisMonth: newUsersThisMonth,
            activeThisWeek: activeUsersThisWeek
          },
          deals: {
            total: totalDeals,
            active: activeDeals,
            completed: completedDeals,
            totalValue: totalDealValue,
            completionRate: totalDeals > 0 ? Math.round((completedDeals / totalDeals) * 100) : 0
          },
          payments: {
            total: totalPayments,
            pending: pendingPayments,
            totalRevenue
          }
        },
        trends: {
          userGrowth,
          dealStats
        },
        generatedAt: now
      }
    });

  } catch (error) {
    console.error('Error getting dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard overview',
      error: error.message
    });
  }
};

/**
 * Get user management data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserManagement = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { 
      page = 1, 
      limit = 20, 
      search, 
      role, 
      status, 
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Verify admin privileges
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Build filter
    const filter = { role: { $ne: 'admin' } };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      filter.accountType = role;
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'inactive') {
        filter.isActive = false;
      } else if (status === 'verified') {
        filter.phoneVerified = true;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get users and total count
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name username email accountType isActive phoneVerified createdAt lastActiveAt earnings')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ]);

    // Get additional stats for each user
    const userIds = users.map(u => u._id);
    const [dealCounts, paymentCounts] = await Promise.all([
      Deal.aggregate([
        {
          $match: {
            $or: [
              { creatorId: { $in: userIds } },
              { marketerId: { $in: userIds } }
            ]
          }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $in: ['$creatorId', userIds] },
                '$creatorId',
                '$marketerId'
              ]
            },
            totalDeals: { $sum: 1 },
            activeDeals: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            completedDeals: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        }
      ]),
      Payment.aggregate([
        {
          $match: {
            $or: [
              { fromUserId: { $in: userIds } },
              { toUserId: { $in: userIds } }
            ]
          }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $in: ['$toUserId', userIds] },
                '$toUserId',
                '$fromUserId'
              ]
            },
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ])
    ]);

    // Merge stats with users
    const enrichedUsers = users.map(user => {
      const dealStats = dealCounts.find(d => d._id.toString() === user._id.toString()) || {
        totalDeals: 0,
        activeDeals: 0,
        completedDeals: 0
      };
      
      const paymentStats = paymentCounts.find(p => p._id.toString() === user._id.toString()) || {
        totalPayments: 0,
        totalAmount: 0
      };

      return {
        ...user,
        stats: {
          deals: dealStats,
          payments: paymentStats
        }
      };
    });

    res.status(200).json({
      success: true,
      data: {
        users: enrichedUsers,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        filters: {
          search,
          role,
          status,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Error getting user management data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user management data',
      error: error.message
    });
  }
};

/**
 * Update user status (activate/deactivate)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const adminUserId = req.user?.userId || req.user?.id;
    const { targetUserId } = req.params;
    const { isActive, reason } = req.body;

    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Verify admin privileges
    const adminUser = await User.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Find target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating other admins
    if (targetUser.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify admin users'
      });
    }

    // Update user status
    targetUser.isActive = isActive;
    targetUser.updatedAt = new Date();

    // Add to admin actions log
    if (!targetUser.adminActions) {
      targetUser.adminActions = [];
    }

    targetUser.adminActions.push({
      action: isActive ? 'activated' : 'deactivated',
      adminId: adminUserId,
      reason: reason || 'No reason provided',
      timestamp: new Date()
    });

    await targetUser.save();

    // Send notification to user
    if (isActive) {
      await Notification.create({
        userId: targetUserId,
        type: 'account_activated',
        title: 'Account Activated',
        message: 'Your account has been activated by an administrator',
        data: { reason }
      });
    } else {
      await Notification.create({
        userId: targetUserId,
        type: 'account_deactivated',
        title: 'Account Deactivated',
        message: 'Your account has been deactivated. Please contact support for assistance.',
        data: { reason }
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        userId: targetUserId,
        isActive,
        updatedAt: targetUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

/**
 * Get deal management data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDealManagement = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Verify admin privileges
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Build filter
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get deals with user details
    const [deals, total] = await Promise.all([
      Deal.find(filter)
        .populate('creatorId', 'name username email accountType')
        .populate('marketerId', 'name username email accountType')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Deal.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        deals,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        filters: {
          status,
          search,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Error getting deal management data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deal management data',
      error: error.message
    });
  }
};

/**
 * Get platform analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { period = '30d' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Verify admin privileges
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Calculate date range
    const now = new Date();
    let daysBack = 30;
    
    switch (period) {
      case '7d': daysBack = 7; break;
      case '30d': daysBack = 30; break;
      case '90d': daysBack = 90; break;
      case '1y': daysBack = 365; break;
    }

    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Revenue analytics
    const revenueAnalytics = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // User acquisition analytics
    const userAnalytics = await User.aggregate([
      {
        $match: {
          role: { $ne: 'admin' },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            accountType: '$accountType'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Deal completion analytics
    const dealAnalytics = await Deal.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            status: '$status'
          },
          count: { $sum: 1 },
          totalValue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        analytics: {
          revenue: revenueAnalytics,
          users: userAnalytics,
          deals: dealAnalytics
        }
      }
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
};