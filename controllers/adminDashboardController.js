const Deal = require('../models/deal');
const Offer = require('../models/offer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Earning = require('../models/earnings');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');
const mongoose = require('mongoose');

/**
 * Admin Dashboard Controller
 * Comprehensive administrative dashboard for platform oversight,
 * analytics, user management, and system health monitoring
 */

// Get comprehensive dashboard overview
exports.getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verify admin access
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return errorResponse(res, "Access denied - admin privileges required", 403);
    }

    const { timeframe = '30d', includeDetails = false } = req.query;
    const timeframeDays = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframeDays);

    // Parallel data collection for performance
    const [
      platformStats,
      userMetrics,
      dealMetrics,
      financialMetrics,
      systemHealth,
      recentActivity,
      alertsAndIssues
    ] = await Promise.all([
      getPlatformStatistics(startDate, timeframeDays),
      getUserMetrics(startDate),
      getDealMetrics(startDate),
      getFinancialMetrics(startDate),
      getSystemHealthMetrics(),
      getRecentActivity(includeDetails),
      getAlertsAndIssues()
    ]);

    const overview = {
      timeframe,
      generatedAt: new Date().toISOString(),
      platform_stats: platformStats,
      user_metrics: userMetrics,
      deal_metrics: dealMetrics,
      financial_metrics: financialMetrics,
      system_health: systemHealth,
      recent_activity: recentActivity,
      alerts_and_issues: alertsAndIssues
    };

    return successResponse(res, "Admin dashboard overview retrieved successfully", {
      overview,
      permissions: getAdminPermissions(user),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error getting admin dashboard overview:", error);
    return handleServerError(res, error);
  }
};

// Get detailed user management data
exports.getUserManagement = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verify admin access
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return errorResponse(res, "Access denied - admin privileges required", 403);
    }

    const { 
      page = 1, 
      limit = 50, 
      role = 'all', 
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = req.query;

    const userManagement = await getUserManagementData(
      page, limit, role, status, sortBy, sortOrder, search
    );

    return successResponse(res, "User management data retrieved successfully", userManagement);

  } catch (error) {
    console.error("Error getting user management data:", error);
    return handleServerError(res, error);
  }
};

// Get deal management and oversight data
exports.getDealManagement = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verify admin access
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return errorResponse(res, "Access denied - admin privileges required", 403);
    }

    const { 
      page = 1, 
      limit = 50, 
      status = 'all',
      risk_level = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = req.query;

    const dealManagement = await getDealManagementData(
      page, limit, status, risk_level, sortBy, sortOrder, search
    );

    return successResponse(res, "Deal management data retrieved successfully", dealManagement);

  } catch (error) {
    console.error("Error getting deal management data:", error);
    return handleServerError(res, error);
  }
};

// Get financial analytics and reports
exports.getFinancialAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verify admin access
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return errorResponse(res, "Access denied - admin privileges required", 403);
    }

    const { timeframe = '30d', breakdown = 'daily', includeProjections = false } = req.query;
    
    const financialAnalytics = await getFinancialAnalyticsData(timeframe, breakdown, includeProjections);

    return successResponse(res, "Financial analytics retrieved successfully", financialAnalytics);

  } catch (error) {
    console.error("Error getting financial analytics:", error);
    return handleServerError(res, error);
  }
};

// Get system health and performance metrics
exports.getSystemHealth = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verify admin access
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return errorResponse(res, "Access denied - admin privileges required", 403);
    }

    const { includeHistory = false, alertsOnly = false } = req.query;
    
    const systemHealth = await getSystemHealthData(includeHistory, alertsOnly);

    return successResponse(res, "System health metrics retrieved successfully", systemHealth);

  } catch (error) {
    console.error("Error getting system health metrics:", error);
    return handleServerError(res, error);
  }
};

// Update user status or permissions (admin action)
exports.updateUserStatus = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { targetUserId } = req.params;
    const { action, reason, notifyUser = true } = req.body;

    // Verify admin access
    const adminUser = await User.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      return errorResponse(res, "Access denied - admin privileges required", 403);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return errorResponse(res, "User not found", 404);
    }

    const result = await executeUserAction(targetUser, action, reason, adminUserId, notifyUser);

    return successResponse(res, "User status updated successfully", {
      action: action,
      targetUser: {
        id: targetUser._id,
        userName: targetUser.userName,
        email: targetUser.email
      },
      changes: result.changes,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error updating user status:", error);
    return handleServerError(res, error);
  }
};

// Perform deal intervention (admin action)
exports.performDealIntervention = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { dealId } = req.params;
    const { intervention_type, resolution, notifyParties = true } = req.body;

    // Verify admin access
    const adminUser = await User.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      return errorResponse(res, "Access denied - admin privileges required", 403);
    }

    const deal = await Deal.findById(dealId).populate('creatorId marketerId');
    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    const result = await executeDealIntervention(deal, intervention_type, resolution, adminUserId, notifyParties);

    return successResponse(res, "Deal intervention completed successfully", {
      dealId: deal._id,
      dealNumber: deal.dealNumber,
      intervention: intervention_type,
      resolution: resolution,
      outcome: result.outcome,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error performing deal intervention:", error);
    return handleServerError(res, error);
  }
};

// Generate comprehensive reports
exports.generateReport = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verify admin access
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return errorResponse(res, "Access denied - admin privileges required", 403);
    }

    const { 
      report_type, 
      timeframe = '30d', 
      format = 'json',
      include_details = false,
      email_delivery = false 
    } = req.body;

    const report = await generateAdminReport(report_type, timeframe, format, include_details);

    if (email_delivery) {
      await emailReportToAdmin(report, user.email);
    }

    return successResponse(res, "Report generated successfully", {
      report,
      downloadUrl: report.downloadUrl,
      format: format,
      generatedAt: new Date().toISOString(),
      emailDelivered: email_delivery
    });

  } catch (error) {
    console.error("Error generating report:", error);
    return handleServerError(res, error);
  }
};

// Helper functions
const getPlatformStatistics = async (startDate, timeframeDays) => {
  const [totalUsers, totalDeals, totalOffers, activeUsers] = await Promise.all([
    User.countDocuments(),
    Deal.countDocuments(),
    Offer.countDocuments(),
    User.countDocuments({ lastActiveAt: { $gte: startDate } })
  ]);

  return {
    total_users: totalUsers,
    total_deals: totalDeals,
    total_offers: totalOffers,
    active_users: activeUsers,
    activity_rate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0,
    growth_metrics: {
      new_users: await User.countDocuments({ createdAt: { $gte: startDate } }),
      new_deals: await Deal.countDocuments({ createdAt: { $gte: startDate } }),
      new_offers: await Offer.countDocuments({ createdAt: { $gte: startDate } })
    }
  };
};

const getUserMetrics = async (startDate) => {
  const userStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
        active: { $sum: { $cond: [{ $gte: ['$lastActiveAt', startDate] }, 1, 0] } }
      }
    }
  ]);

  const topCreators = await User.find({ role: 'creator' })
    .select('userName email socialMediaStats earnings')
    .sort({ 'socialMediaStats.totalFollowers': -1 })
    .limit(10);

  const topMarketers = await Deal.aggregate([
    { $group: { _id: '$marketerId', dealCount: { $sum: 1 }, totalValue: { $sum: '$paymentInfo.paymentAmount' } } },
    { $sort: { totalValue: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' }
  ]);

  return {
    by_role: userStats,
    top_creators: topCreators,
    top_marketers: topMarketers,
    verification_rate: await calculateVerificationRate(),
    engagement_metrics: await calculateEngagementMetrics(startDate)
  };
};

const getDealMetrics = async (startDate) => {
  const dealStats = await Deal.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$paymentInfo.paymentAmount' },
        avgValue: { $avg: '$paymentInfo.paymentAmount' }
      }
    }
  ]);

  const completionStats = await Deal.aggregate([
    {
      $match: { status: 'completed' }
    },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: { $subtract: ['$completedAt', '$createdAt'] } },
        totalCompleted: { $sum: 1 }
      }
    }
  ]);

  const riskAssessment = await Deal.aggregate([
    {
      $addFields: {
        riskLevel: {
          $cond: [
            { $or: [
              { $eq: ['$status', 'disputed'] },
              { $lt: [{ $subtract: [new Date(), '$createdAt'] }, 7 * 24 * 60 * 60 * 1000] }
            ]},
            'high',
            { $cond: [
              { $or: [
                { $gt: [{ $subtract: [new Date(), '$updatedAt'] }, 7 * 24 * 60 * 60 * 1000] },
                { $lt: ['$paymentInfo.paymentAmount', 100] }
              ]},
              'medium',
              'low'
            ]}
          ]
        }
      }
    },
    {
      $group: {
        _id: '$riskLevel',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    by_status: dealStats,
    completion_metrics: completionStats[0] || { avgDuration: 0, totalCompleted: 0 },
    risk_assessment: riskAssessment,
    recent_disputes: await getRecentDisputes(),
    platform_fees: await calculatePlatformFees(startDate)
  };
};

const getFinancialMetrics = async (startDate) => {
  const financialStats = await Earning.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const monthlyRevenue = await Deal.aggregate([
    {
      $match: { 
        createdAt: { $gte: startDate },
        'paymentInfo.isPaid': true 
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$paymentInfo.paymentAmount' },
        dealCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  const escrowBalance = await Earning.aggregate([
    {
      $match: { status: 'escrowed' }
    },
    {
      $group: {
        _id: null,
        totalEscrowed: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    earning_stats: financialStats,
    monthly_revenue: monthlyRevenue,
    escrow_balance: escrowBalance[0] || { totalEscrowed: 0, count: 0 },
    payment_processing: await getPaymentProcessingStats(),
    fee_collection: await getFeeCollectionStats(startDate)
  };
};

const getSystemHealthMetrics = async () => {
  const dbStats = await mongoose.connection.db.stats();
  
  const healthMetrics = {
    database: {
      status: 'healthy',
      collections: dbStats.collections,
      dataSize: dbStats.dataSize,
      indexSize: dbStats.indexSize,
      avgObjSize: dbStats.avgObjSize
    },
    performance: {
      avg_response_time: await calculateAverageResponseTime(),
      error_rate: await calculateErrorRate(),
      uptime: process.uptime(),
      memory_usage: process.memoryUsage()
    },
    notifications: {
      pending: await Notification.countDocuments({ delivered: false }),
      failed: await Notification.countDocuments({ status: 'failed' }),
      delivery_rate: await calculateNotificationDeliveryRate()
    },
    background_jobs: {
      status: 'operational',
      last_run_times: await getLastJobRunTimes(),
      failure_count: await getJobFailureCount()
    }
  };

  return healthMetrics;
};

const getRecentActivity = async (includeDetails) => {
  const activities = [];

  // Recent user registrations
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(includeDetails ? 20 : 5)
    .select('userName email role createdAt');

  activities.push({
    type: 'user_registrations',
    count: recentUsers.length,
    items: recentUsers.map(user => ({
      id: user._id,
      userName: user.userName,
      email: includeDetails ? user.email : undefined,
      role: user.role,
      timestamp: user.createdAt
    }))
  });

  // Recent deals
  const recentDeals = await Deal.find()
    .sort({ createdAt: -1 })
    .limit(includeDetails ? 20 : 5)
    .populate('creatorId marketerId', 'userName')
    .select('dealName status paymentInfo createdAt');

  activities.push({
    type: 'recent_deals',
    count: recentDeals.length,
    items: recentDeals.map(deal => ({
      id: deal._id,
      dealName: deal.dealName,
      status: deal.status,
      creator: deal.creatorId?.userName,
      marketer: deal.marketerId?.userName,
      amount: deal.paymentInfo?.paymentAmount,
      timestamp: deal.createdAt
    }))
  });

  // Recent system alerts
  const recentAlerts = await getRecentSystemAlerts(includeDetails ? 10 : 3);
  activities.push({
    type: 'system_alerts',
    count: recentAlerts.length,
    items: recentAlerts
  });

  return activities;
};

const getAlertsAndIssues = async () => {
  const alerts = [];

  // High-risk deals
  const highRiskDeals = await Deal.find({
    $or: [
      { status: 'disputed' },
      { 
        status: 'active',
        updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    ]
  }).countDocuments();

  if (highRiskDeals > 0) {
    alerts.push({
      type: 'high_risk_deals',
      severity: 'high',
      message: `${highRiskDeals} deals require attention`,
      count: highRiskDeals,
      action_required: true
    });
  }

  // Pending verifications
  const pendingVerifications = await User.find({
    role: 'creator',
    isVerified: false,
    verificationSubmittedAt: { $exists: true }
  }).countDocuments();

  if (pendingVerifications > 0) {
    alerts.push({
      type: 'pending_verifications',
      severity: 'medium',
      message: `${pendingVerifications} users awaiting verification`,
      count: pendingVerifications,
      action_required: true
    });
  }

  // Large escrow amounts
  const largeEscrow = await Earning.aggregate([
    {
      $match: { status: 'escrowed', amount: { $gt: 5000 } }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  if (largeEscrow.length > 0 && largeEscrow[0].count > 0) {
    alerts.push({
      type: 'large_escrow_amounts',
      severity: 'medium',
      message: `$${largeEscrow[0].totalAmount.toLocaleString()} in high-value escrow (${largeEscrow[0].count} deals)`,
      count: largeEscrow[0].count,
      action_required: false
    });
  }

  // System performance issues
  const errorRate = await calculateErrorRate();
  if (errorRate > 5) { // More than 5% error rate
    alerts.push({
      type: 'high_error_rate',
      severity: 'critical',
      message: `System error rate at ${errorRate.toFixed(1)}%`,
      count: 1,
      action_required: true
    });
  }

  return alerts;
};

const getUserManagementData = async (page, limit, role, status, sortBy, sortOrder, search) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (role !== 'all') query.role = role;
  if (status !== 'all') {
    if (status === 'verified') query.isVerified = true;
    if (status === 'unverified') query.isVerified = false;
    if (status === 'suspended') query.isSuspended = true;
  }

  if (search) {
    query.$or = [
      { userName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const [users, totalCount] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query)
  ]);

  return {
    users,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNext: skip + users.length < totalCount,
      hasPrev: page > 1
    },
    filters: { role, status, search, sortBy, sortOrder }
  };
};

const getDealManagementData = async (page, limit, status, riskLevel, sortBy, sortOrder, search) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (status !== 'all') query.status = status;
  
  if (search) {
    query.$or = [
      { dealName: { $regex: search, $options: 'i' } },
      { dealNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const [deals, totalCount] = await Promise.all([
    Deal.find(query)
      .populate('creatorId marketerId', 'userName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    Deal.countDocuments(query)
  ]);

  // Add risk assessment to each deal
  const dealsWithRisk = deals.map(deal => ({
    ...deal.toObject(),
    riskLevel: assessDealRisk(deal)
  }));

  // Filter by risk level if specified
  const filteredDeals = riskLevel !== 'all' 
    ? dealsWithRisk.filter(deal => deal.riskLevel === riskLevel)
    : dealsWithRisk;

  return {
    deals: filteredDeals,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNext: skip + deals.length < totalCount,
      hasPrev: page > 1
    },
    filters: { status, riskLevel, search, sortBy, sortOrder }
  };
};

const getFinancialAnalyticsData = async (timeframe, breakdown, includeProjections) => {
  const timeframeDays = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframeDays);

  const analytics = {
    timeframe,
    breakdown,
    revenue_analysis: await getRevenueAnalysis(startDate, breakdown),
    transaction_volume: await getTransactionVolume(startDate, breakdown),
    fee_breakdown: await getFeeBreakdown(startDate),
    payout_analysis: await getPayoutAnalysis(startDate),
    growth_metrics: await getGrowthMetrics(startDate, timeframeDays)
  };

  if (includeProjections) {
    analytics.projections = await generateFinancialProjections(analytics);
  }

  return analytics;
};

const getSystemHealthData = async (includeHistory, alertsOnly) => {
  const healthData = {
    current_status: await getSystemHealthMetrics(),
    performance_indicators: await getPerformanceIndicators(),
    resource_utilization: await getResourceUtilization(),
    error_tracking: await getErrorTracking(),
    uptime_statistics: await getUptimeStatistics()
  };

  if (includeHistory) {
    healthData.historical_data = await getHistoricalHealthData();
  }

  if (alertsOnly) {
    healthData.active_alerts = await getActiveSystemAlerts();
  }

  return healthData;
};

// Additional helper functions for calculations and data processing
const calculateVerificationRate = async () => {
  const [total, verified] = await Promise.all([
    User.countDocuments({ role: 'creator' }),
    User.countDocuments({ role: 'creator', isVerified: true })
  ]);
  return total > 0 ? ((verified / total) * 100).toFixed(1) : 0;
};

const calculateEngagementMetrics = async (startDate) => {
  const activeUsers = await User.countDocuments({ 
    lastActiveAt: { $gte: startDate } 
  });
  const totalUsers = await User.countDocuments();
  
  return {
    daily_active_rate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0,
    avg_session_duration: '25 minutes', // Placeholder - would calculate from real session data
    bounce_rate: '15%' // Placeholder - would calculate from real analytics
  };
};

const assessDealRisk = (deal) => {
  let riskScore = 0;
  
  // Status-based risk
  if (deal.status === 'disputed') riskScore += 30;
  if (deal.status === 'cancelled') riskScore += 20;
  
  // Timeline risk
  const daysSinceUpdate = (new Date() - new Date(deal.updatedAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate > 7) riskScore += 15;
  if (daysSinceUpdate > 14) riskScore += 15;
  
  // Payment risk
  if (!deal.paymentInfo?.isPaid && deal.status === 'active') riskScore += 20;
  
  // Amount risk
  if (deal.paymentInfo?.paymentAmount > 5000) riskScore += 10;
  
  if (riskScore >= 40) return 'high';
  if (riskScore >= 20) return 'medium';
  return 'low';
};

const executeUserAction = async (user, action, reason, adminId, notifyUser) => {
  const changes = {};
  
  switch (action) {
    case 'suspend':
      user.isSuspended = true;
      user.suspensionReason = reason;
      changes.suspended = true;
      break;
    case 'unsuspend':
      user.isSuspended = false;
      user.suspensionReason = null;
      changes.unsuspended = true;
      break;
    case 'verify':
      user.isVerified = true;
      changes.verified = true;
      break;
    case 'unverify':
      user.isVerified = false;
      changes.unverified = true;
      break;
    default:
      throw new Error('Invalid action');
  }
  
  await user.save();
  
  // Log admin action
  console.log(`Admin ${adminId} performed ${action} on user ${user._id}: ${reason}`);
  
  if (notifyUser) {
    await Notification.create({
      user: user._id,
      type: 'admin_action',
      title: `Account ${action}`,
      subtitle: reason,
      data: { action, adminId, timestamp: new Date() }
    });
  }
  
  return { changes };
};

const executeDealIntervention = async (deal, interventionType, resolution, adminId, notifyParties) => {
  let outcome = {};
  
  switch (interventionType) {
    case 'resolve_dispute':
      deal.status = 'active';
      deal.disputeResolution = resolution;
      outcome.resolved = true;
      break;
    case 'cancel_deal':
      deal.status = 'cancelled';
      deal.cancellationReason = resolution;
      outcome.cancelled = true;
      break;
    case 'force_completion':
      deal.status = 'completed';
      deal.completedAt = new Date();
      outcome.completed = true;
      break;
    case 'extend_deadline':
      // Extend all milestone deadlines by specified days
      const extensionDays = parseInt(resolution) || 7;
      deal.milestones?.forEach(milestone => {
        if (milestone.dueDate) {
          milestone.dueDate = new Date(milestone.dueDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);
        }
      });
      outcome.extended = extensionDays;
      break;
    default:
      throw new Error('Invalid intervention type');
  }
  
  await deal.save();
  
  // Log admin intervention
  console.log(`Admin ${adminId} performed ${interventionType} on deal ${deal._id}: ${resolution}`);
  
  if (notifyParties) {
    await Promise.all([
      Notification.create({
        user: deal.creatorId._id,
        type: 'admin_intervention',
        title: 'Deal Intervention',
        subtitle: `Admin has ${interventionType.replace('_', ' ')} for deal ${deal.dealNumber}`,
        data: { dealId: deal._id, intervention: interventionType, resolution }
      }),
      Notification.create({
        user: deal.marketerId._id,
        type: 'admin_intervention',
        title: 'Deal Intervention',
        subtitle: `Admin has ${interventionType.replace('_', ' ')} for deal ${deal.dealNumber}`,
        data: { dealId: deal._id, intervention: interventionType, resolution }
      })
    ]);
  }
  
  return { outcome };
};

const getAdminPermissions = (user) => {
  return {
    canViewUsers: true,
    canModifyUsers: true,
    canViewDeals: true,
    canInterveneDeal: true,
    canViewFinancials: true,
    canGenerateReports: true,
    canAccessSystemHealth: true,
    canPerformMaintenance: user.role === 'super_admin'
  };
};

// Placeholder functions for additional data calculations
const getRecentDisputes = async () => {
  return await Deal.find({ status: 'disputed' })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('creatorId marketerId', 'userName')
    .select('dealName dealNumber createdAt');
};

const calculatePlatformFees = async (startDate) => {
  // Placeholder calculation - would calculate actual platform fees
  const totalDeals = await Deal.countDocuments({ 
    createdAt: { $gte: startDate },
    'paymentInfo.isPaid': true 
  });
  
  return {
    total_fees_collected: totalDeals * 15, // Example: $15 per deal
    fee_rate: '5%',
    total_deals: totalDeals
  };
};

const calculateAverageResponseTime = async () => {
  // Placeholder - would calculate from actual performance metrics
  return '150ms';
};

const calculateErrorRate = async () => {
  // Placeholder - would calculate from actual error logs
  return 2.5; // 2.5% error rate
};

const calculateNotificationDeliveryRate = async () => {
  const [total, delivered] = await Promise.all([
    Notification.countDocuments(),
    Notification.countDocuments({ delivered: true })
  ]);
  return total > 0 ? ((delivered / total) * 100).toFixed(1) : 100;
};

const getLastJobRunTimes = async () => {
  // Placeholder - would get actual cron job run times
  return {
    'payment_release': new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    'notification_cleanup': new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    'user_engagement': new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
  };
};

const getJobFailureCount = async () => {
  // Placeholder - would get actual job failure counts
  return {
    'payment_release': 0,
    'notification_cleanup': 1,
    'user_engagement': 0
  };
};

const getRecentSystemAlerts = async (limit) => {
  // Placeholder - would get actual system alerts
  return [
    {
      id: '1',
      type: 'performance',
      message: 'Database response time increased',
      severity: 'medium',
      timestamp: new Date(Date.now() - 30 * 60 * 1000)
    }
  ].slice(0, limit);
};

// Additional placeholder functions would be implemented here for:
// - getRevenueAnalysis, getTransactionVolume, getFeeBreakdown, etc.
// - getPerformanceIndicators, getResourceUtilization, etc.
// - generateAdminReport, emailReportToAdmin, etc.

module.exports = exports;