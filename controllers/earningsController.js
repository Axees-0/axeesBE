const User = require('../models/User');
const Deal = require('../models/Deal');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const { ObjectId } = require('mongodb');

/**
 * Get user withdrawal limits and available balance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWithdrawalLimits = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get user and their earnings data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate available balance
    const totalEarnings = user.earnings?.total || 0;
    const totalWithdrawn = user.earnings?.withdrawn || 0;
    const availableBalance = totalEarnings - totalWithdrawn;

    // Get withdrawal limits (can be customized per user type)
    const limits = {
      daily: {
        amount: 500,
        currency: 'USD'
      },
      monthly: {
        amount: 10000,
        currency: 'USD'
      },
      minimum: {
        amount: 50,
        currency: 'USD'
      },
      maximum: {
        amount: 5000,
        currency: 'USD'
      }
    };

    // Calculate remaining limits for today and this month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get withdrawals for today
    const dailyWithdrawals = await Withdrawal.aggregate([
      {
        $match: {
          userId: new ObjectId(userId),
          status: { $in: ['completed', 'pending'] },
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Get withdrawals for this month
    const monthlyWithdrawals = await Withdrawal.aggregate([
      {
        $match: {
          userId: new ObjectId(userId),
          status: { $in: ['completed', 'pending'] },
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const dailyUsed = dailyWithdrawals[0]?.total || 0;
    const monthlyUsed = monthlyWithdrawals[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        limits,
        remaining: {
          daily: Math.max(0, limits.daily.amount - dailyUsed),
          monthly: Math.max(0, limits.monthly.amount - monthlyUsed)
        },
        availableBalance,
        totalEarnings,
        totalWithdrawn
      }
    });

  } catch (error) {
    console.error('Error getting withdrawal limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal limits',
      error: error.message
    });
  }
};

/**
 * Get user earnings analytics and insights
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getEarningsAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { period = '30d', startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Calculate date range
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      // Use period
      const now = new Date();
      let daysBack = 30;
      
      switch (period) {
        case '7d':
          daysBack = 7;
          break;
        case '30d':
          daysBack = 30;
          break;
        case '90d':
          daysBack = 90;
          break;
        case '1y':
          daysBack = 365;
          break;
      }

      const startPeriod = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      dateFilter = {
        createdAt: { $gte: startPeriod }
      };
    }

    // Get earnings summary
    const dealsSummary = await Deal.aggregate([
      {
        $match: {
          $or: [
            { creatorId: new ObjectId(userId) },
            { marketerId: new ObjectId(userId) }
          ],
          status: 'completed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: {
            $sum: {
              $cond: [
                { $eq: ['$creatorId', new ObjectId(userId)] },
                '$creatorEarnings',
                '$marketerEarnings'
              ]
            }
          },
          totalDeals: { $sum: 1 },
          avgDealValue: {
            $avg: {
              $cond: [
                { $eq: ['$creatorId', new ObjectId(userId)] },
                '$creatorEarnings',
                '$marketerEarnings'
              ]
            }
          }
        }
      }
    ]);

    // Get earnings over time
    const earningsOverTime = await Deal.aggregate([
      {
        $match: {
          $or: [
            { creatorId: new ObjectId(userId) },
            { marketerId: new ObjectId(userId) }
          ],
          status: 'completed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$completedAt'
            }
          },
          earnings: {
            $sum: {
              $cond: [
                { $eq: ['$creatorId', new ObjectId(userId)] },
                '$creatorEarnings',
                '$marketerEarnings'
              ]
            }
          },
          deals: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get earnings by category
    const earningsByCategory = await Deal.aggregate([
      {
        $match: {
          $or: [
            { creatorId: new ObjectId(userId) },
            { marketerId: new ObjectId(userId) }
          ],
          status: 'completed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$category',
          earnings: {
            $sum: {
              $cond: [
                { $eq: ['$creatorId', new ObjectId(userId)] },
                '$creatorEarnings',
                '$marketerEarnings'
              ]
            }
          },
          deals: { $sum: 1 }
        }
      },
      {
        $sort: { earnings: -1 }
      }
    ]);

    const summary = dealsSummary[0] || {
      totalEarnings: 0,
      totalDeals: 0,
      avgDealValue: 0
    };

    res.status(200).json({
      success: true,
      data: {
        period,
        summary,
        earningsOverTime,
        earningsByCategory
      }
    });

  } catch (error) {
    console.error('Error getting earnings analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings analytics',
      error: error.message
    });
  }
};

/**
 * Get detailed transaction history for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const {
      page = 1,
      limit = 20,
      type,
      status,
      startDate,
      endDate
    } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Build filter
    const filter = {
      userId: new ObjectId(userId)
    };

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Get transactions
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(filter)
    ]);

    // Format transactions
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt,
      completedAt: transaction.completedAt,
      metadata: transaction.metadata
    }));

    res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history',
      error: error.message
    });
  }
};