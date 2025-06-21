const User = require('../models/User');
const Deal = require('../models/deal');
const withdrawal = require('../models/withdrawal');
const mongoose = require('mongoose');

/**
 * Get withdrawal limits for a user
 * @route GET /api/earnings/withdraw/limits
 */
exports.getWithdrawalLimits = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate user's total earnings from completed deals
    const completedDeals = await Deal.aggregate([
      {
        $match: {
          $or: [
            { creatorId: new mongoose.Types.ObjectId(userId) },
            { marketerId: new mongoose.Types.ObjectId(userId) }
          ],
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalEarnings = completedDeals[0]?.totalEarnings || 0;

    // Calculate total withdrawn amount
    const totalWithdrawn = await withdrawal.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: { $in: ['completed', 'pending'] }
        }
      },
      {
        $group: {
          _id: null,
          totalWithdrawn: { $sum: '$amount' }
        }
      }
    ]);

    const withdrawnAmount = totalWithdrawn[0]?.totalWithdrawn || 0;
    const availableBalance = totalEarnings - withdrawnAmount;

    // Define withdrawal limits based on user level/verification
    const limits = {
      daily: {
        amount: user.isVerified ? 5000 : 1000, // $5000 for verified, $1000 for unverified
        currency: 'USD'
      },
      monthly: {
        amount: user.isVerified ? 50000 : 10000, // $50k for verified, $10k for unverified
        currency: 'USD'
      },
      minimum: {
        amount: 10, // $10 minimum withdrawal
        currency: 'USD'
      },
      maximum: {
        amount: Math.min(availableBalance, user.isVerified ? 10000 : 2500), // Max per transaction
        currency: 'USD'
      }
    };

    // Calculate remaining limits for today and this month
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dailyWithdrawals, monthlyWithdrawals] = await Promise.all([
      withdrawal.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startOfDay },
            status: { $in: ['completed', 'pending'] }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      withdrawal.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startOfMonth },
            status: { $in: ['completed', 'pending'] }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const dailyUsed = dailyWithdrawals[0]?.totalAmount || 0;
    const monthlyUsed = monthlyWithdrawals[0]?.totalAmount || 0;

    res.status(200).json({
      success: true,
      data: {
        limits,
        remaining: {
          daily: Math.max(0, limits.daily.amount - dailyUsed),
          monthly: Math.max(0, limits.monthly.amount - monthlyUsed)
        },
        used: {
          daily: dailyUsed,
          monthly: monthlyUsed
        },
        availableBalance,
        totalEarnings,
        totalWithdrawn: withdrawnAmount,
        userVerificationStatus: user.isVerified || false
      }
    });

  } catch (error) {
    console.error('Get withdrawal limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal limits',
      error: error.message
    });
  }
};

/**
 * Get earnings analytics for a user
 * @route GET /api/earnings/analytics
 */
exports.getEarningsAnalytics = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { period = '30d', startDate, endDate } = req.query;

    // Calculate date range
    let matchDate = {};
    if (startDate && endDate) {
      matchDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      const now = new Date();
      let daysBack = 30;
      
      switch (period) {
        case '7d': daysBack = 7; break;
        case '30d': daysBack = 30; break;
        case '90d': daysBack = 90; break;
        case '1y': daysBack = 365; break;
        default: daysBack = 30;
      }
      
      const startOfPeriod = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      matchDate = { $gte: startOfPeriod };
    }

    // Get earnings over time
    const earningsOverTime = await Deal.aggregate([
      {
        $match: {
          $or: [
            { creatorId: new mongoose.Types.ObjectId(userId) },
            { marketerId: new mongoose.Types.ObjectId(userId) }
          ],
          status: 'completed',
          completedAt: matchDate
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
          earnings: { $sum: '$totalAmount' },
          deals: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get total earnings summary
    const totalEarnings = await Deal.aggregate([
      {
        $match: {
          $or: [
            { creatorId: new mongoose.Types.ObjectId(userId) },
            { marketerId: new mongoose.Types.ObjectId(userId) }
          ],
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$totalAmount' },
          totalDeals: { $sum: 1 },
          avgDealValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Get earnings by deal type/category
    const earningsByCategory = await Deal.aggregate([
      {
        $match: {
          $or: [
            { creatorId: new mongoose.Types.ObjectId(userId) },
            { marketerId: new mongoose.Types.ObjectId(userId) }
          ],
          status: 'completed',
          completedAt: matchDate
        }
      },
      {
        $group: {
          _id: '$category',
          earnings: { $sum: '$totalAmount' },
          deals: { $sum: 1 }
        }
      },
      {
        $sort: { earnings: -1 }
      }
    ]);

    // Get withdrawal analytics
    const withdrawalData = await withdrawal.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: matchDate
        }
      },
      {
        $group: {
          _id: {
            status: '$status'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        summary: {
          totalEarnings: totalEarnings[0]?.totalEarnings || 0,
          totalDeals: totalEarnings[0]?.totalDeals || 0,
          avgDealValue: totalEarnings[0]?.avgDealValue || 0
        },
        earningsOverTime,
        earningsByCategory,
        withdrawals: {
          completed: withdrawalData.find(w => w._id.status === 'completed')?.total || 0,
          pending: withdrawalData.find(w => w._id.status === 'pending')?.total || 0,
          failed: withdrawalData.find(w => w._id.status === 'failed')?.total || 0
        }
      }
    });

  } catch (error) {
    console.error('Get earnings analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings analytics',
      error: error.message
    });
  }
};

/**
 * Get detailed transaction history for a user
 * @route GET /api/earnings/transactions
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status, 
      startDate, 
      endDate 
    } = req.query;

    const skip = (page - 1) * limit;

    // Build transaction query for deals (earnings)
    let dealQuery = {
      $or: [
        { creatorId: new mongoose.Types.ObjectId(userId) },
        { marketerId: new mongoose.Types.ObjectId(userId) }
      ]
    };

    // Build withdrawal query
    let withdrawalQuery = { userId: new mongoose.Types.ObjectId(userId) };

    // Apply filters
    if (status) {
      dealQuery.status = status;
      withdrawalQuery.status = status;
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      
      dealQuery.createdAt = dateFilter;
      withdrawalQuery.createdAt = dateFilter;
    }

    // Get deals (earnings transactions)
    const dealsPromise = Deal.find(dealQuery)
      .populate('creatorId', 'name userName')
      .populate('marketerId', 'name userName')
      .select('totalAmount status createdAt completedAt description category')
      .sort({ createdAt: -1 });

    // Get withdrawals
    const withdrawalsPromise = withdrawal.find(withdrawalQuery)
      .select('amount status createdAt completedAt method description')
      .sort({ createdAt: -1 });

    const [deals, withdrawals] = await Promise.all([dealsPromise, withdrawalsPromise]);

    // Format transactions
    const transactions = [];

    // Add deals as earning transactions
    if (!type || type === 'earning') {
      deals.forEach(deal => {
        const isCreator = deal.creatorId._id.toString() === userId.toString();
        transactions.push({
          id: deal._id,
          type: 'earning',
          amount: deal.totalAmount,
          status: deal.status,
          description: deal.description || `Deal with ${isCreator ? deal.marketerId.name : deal.creatorId.name}`,
          category: deal.category,
          createdAt: deal.createdAt,
          completedAt: deal.completedAt,
          counterparty: isCreator ? {
            id: deal.marketerId._id,
            name: deal.marketerId.name,
            userName: deal.marketerId.userName,
            type: 'marketer'
          } : {
            id: deal.creatorId._id,
            name: deal.creatorId.name,
            userName: deal.creatorId.userName,
            type: 'creator'
          }
        });
      });
    }

    // Add withdrawals as withdrawal transactions
    if (!type || type === 'withdrawal') {
      withdrawals.forEach(w => {
        transactions.push({
          id: w._id,
          type: 'withdrawal',
          amount: -w.amount, // Negative for withdrawals
          status: w.status,
          description: w.description || 'Withdrawal',
          method: w.method,
          createdAt: w.createdAt,
          completedAt: w.completedAt
        });
      });
    }

    // Sort by date and paginate
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));

    // Get total count for pagination
    const totalCount = transactions.length;

    res.status(200).json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
};

/**
 * Get withdrawal limits and settings
 * GET /api/earnings/withdraw/limits
 */
const getWithdrawalLimits = async (req, res) => {
  try {
    const userId = req.user._id;

    // Mock withdrawal limits data - replace with actual business logic
    const limits = {
      minimum: {
        amount: 50,
        currency: 'USD'
      },
      maximum: {
        daily: 5000,
        monthly: 50000,
        currency: 'USD'
      },
      processing: {
        standard: {
          timeframe: '3-5 business days',
          fee: 0
        },
        express: {
          timeframe: '1-2 business days', 
          fee: 2.5
        }
      },
      user: {
        dailyUsed: 0,
        monthlyUsed: 0,
        availableBalance: 0 // This should come from actual earnings calculation
      }
    };

    res.status(200).json({
      success: true,
      message: 'Withdrawal limits retrieved successfully',
      data: limits
    });

  } catch (error) {
    console.error('Get withdrawal limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal limits',
      error: error.message
    });
  }
};

/**
 * Get earnings analytics
 * GET /api/earnings/analytics
 */
const getEarningsAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Mock analytics data - replace with actual business logic
    const analytics = {
      summary: {
        totalEarnings: 0,
        thisMonth: 0,
        lastMonth: 0,
        growth: 0
      },
      trends: [],
      projections: {
        nextMonth: 0,
        nextQuarter: 0
      }
    };

    res.status(200).json({
      success: true,
      message: 'Earnings analytics retrieved successfully',
      data: analytics
    });

  } catch (error) {
    console.error('Get earnings analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings analytics',
      error: error.message
    });
  }
};

/**
 * Get transaction history
 * GET /api/earnings/transactions
 */
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, type = 'all' } = req.query;

    // Mock transaction history - replace with actual business logic
    const transactions = {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    };

    res.status(200).json({
      success: true,
      message: 'Transaction history retrieved successfully',
      data: transactions
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
};

module.exports = {
  getWithdrawalLimits,
  getEarningsAnalytics,
  getTransactionHistory
};