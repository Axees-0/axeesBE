const Deal = require('../models/deal');
const Offer = require('../models/offer');
const User = require('../models/User');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');
const mongoose = require('mongoose');

/**
 * Deal Dashboard Controller
 * Handles deal projections, ARR calculations, and performance metrics (Bug #8)
 */

// Get deal dashboard with ARR calculations and projections
exports.getDealDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = '12m', includeProjections = true, userType } = req.query;

    // Get user information
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Determine date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '1m':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '12m':
      default:
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Build query based on user type and role
    let dealQuery = {};
    let offerQuery = {};
    const isMarketer = user.userType === 'Marketer' || userType === 'marketer';
    const isCreator = user.userType === 'Creator' || userType === 'creator';

    if (isMarketer) {
      dealQuery.marketerId = userId;
      offerQuery.marketerId = userId;
    } else if (isCreator) {
      dealQuery.creatorId = userId;
      offerQuery.creatorId = userId;
    } else {
      // Show both if admin or unspecified
      dealQuery = {
        $or: [
          { marketerId: userId },
          { creatorId: userId }
        ]
      };
      offerQuery = {
        $or: [
          { marketerId: userId },
          { creatorId: userId }
        ]
      };
    }

    // Add date filter
    dealQuery.createdAt = { $gte: startDate, $lte: endDate };
    offerQuery.createdAt = { $gte: startDate, $lte: endDate };

    // Get deals and offers data
    const [deals, offers] = await Promise.all([
      Deal.find(dealQuery)
        .populate('marketerId', 'name userName')
        .populate('creatorId', 'name userName')
        .sort({ createdAt: -1 }),
      Offer.find(offerQuery)
        .populate('marketerId', 'name userName')
        .populate('creatorId', 'name userName')
        .sort({ createdAt: -1 })
    ]);

    // Calculate ARR and metrics
    const arrCalculations = calculateARR(deals, timeframe);
    const dealMetrics = calculateDealMetrics(deals, offers, isMarketer);
    const revenueProjections = includeProjections ? calculateRevenueProjections(deals, offers, timeframe) : null;
    const performanceMetrics = calculatePerformanceMetrics(deals, offers, isMarketer);
    const monthlyBreakdown = generateMonthlyBreakdown(deals, offers, startDate, endDate);

    // Generate insights and recommendations
    const insights = generateDashboardInsights(arrCalculations, dealMetrics, performanceMetrics, isMarketer);

    const dashboardData = {
      summary: {
        timeframe,
        periodStart: startDate,
        periodEnd: endDate,
        userRole: isMarketer ? 'marketer' : 'creator',
        totalDeals: deals.length,
        totalOffers: offers.length
      },
      arr: arrCalculations,
      dealMetrics,
      performanceMetrics,
      revenueProjections,
      monthlyBreakdown,
      insights,
      recentActivity: {
        recentDeals: deals.slice(0, 5).map(deal => ({
          id: deal._id,
          dealName: deal.dealName,
          status: deal.status,
          amount: deal.paymentInfo.paymentAmount,
          createdAt: deal.createdAt,
          otherParty: isMarketer ? deal.creatorId : deal.marketerId
        })),
        recentOffers: offers.slice(0, 5).map(offer => ({
          id: offer._id,
          offerName: offer.offerName,
          status: offer.status,
          amount: offer.proposedAmount,
          createdAt: offer.createdAt,
          otherParty: isMarketer ? offer.creatorId : offer.marketerId
        }))
      }
    };

    return successResponse(res, "Deal dashboard retrieved successfully", dashboardData);

  } catch (error) {
    console.error("Error getting deal dashboard:", error);
    return handleServerError(res, error);
  }
};

// Calculate Annual Recurring Revenue (ARR)
const calculateARR = (deals, timeframe) => {
  const currentYear = new Date().getFullYear();
  const currentYearDeals = deals.filter(deal => 
    new Date(deal.createdAt).getFullYear() === currentYear &&
    ['active', 'completed'].includes(deal.status)
  );

  // Calculate total contract value for the year
  const totalContractValue = currentYearDeals.reduce((total, deal) => {
    return total + (deal.paymentInfo.paymentAmount || 0);
  }, 0);

  // Calculate ARR based on deal frequency and duration
  let annualRecurringRevenue = 0;
  const recurringDeals = currentYearDeals.filter(deal => {
    // Identify recurring deals (deals with multiple milestones or ongoing relationships)
    return deal.milestones && deal.milestones.length > 2;
  });

  recurringDeals.forEach(deal => {
    const dealValue = deal.paymentInfo.paymentAmount || 0;
    // Assume deals with multiple milestones represent ongoing relationships
    // Estimate annual value based on deal structure
    if (deal.milestones.length >= 4) {
      // Quarterly deals - multiply by 4
      annualRecurringRevenue += dealValue * 4;
    } else if (deal.milestones.length >= 2) {
      // Semi-annual deals - multiply by 2
      annualRecurringRevenue += dealValue * 2;
    } else {
      // One-time deals
      annualRecurringRevenue += dealValue;
    }
  });

  // Calculate growth rate
  const lastYear = currentYear - 1;
  const lastYearDeals = deals.filter(deal => 
    new Date(deal.createdAt).getFullYear() === lastYear
  );
  
  const lastYearRevenue = lastYearDeals.reduce((total, deal) => {
    return total + (deal.paymentInfo.paymentAmount || 0);
  }, 0);

  const growthRate = lastYearRevenue > 0 ? 
    ((totalContractValue - lastYearRevenue) / lastYearRevenue * 100) : 0;

  // Monthly recurring revenue (MRR)
  const monthlyRecurringRevenue = annualRecurringRevenue / 12;

  // Projected ARR based on current trends
  const currentMonth = new Date().getMonth() + 1;
  const projectedAnnualValue = currentMonth > 0 ? 
    (totalContractValue / currentMonth) * 12 : totalContractValue;

  return {
    currentARR: Math.round(annualRecurringRevenue),
    projectedARR: Math.round(projectedAnnualValue),
    monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue),
    totalContractValue: Math.round(totalContractValue),
    recurringDealsCount: recurringDeals.length,
    totalDealsCount: currentYearDeals.length,
    growthRate: Math.round(growthRate * 100) / 100,
    averageDealValue: currentYearDeals.length > 0 ? 
      Math.round(totalContractValue / currentYearDeals.length) : 0,
    breakdown: {
      quarterly: recurringDeals.filter(d => d.milestones.length >= 4).length,
      semiAnnual: recurringDeals.filter(d => d.milestones.length >= 2 && d.milestones.length < 4).length,
      oneTime: currentYearDeals.length - recurringDeals.length
    }
  };
};

// Calculate deal metrics
const calculateDealMetrics = (deals, offers, isMarketer) => {
  const totalDeals = deals.length;
  const activeDeals = deals.filter(d => d.status === 'active').length;
  const completedDeals = deals.filter(d => d.status === 'completed').length;
  const cancelledDeals = deals.filter(d => d.status === 'cancelled').length;

  // Conversion metrics
  const acceptedOffers = offers.filter(o => o.status === 'Accepted').length;
  const totalOffers = offers.length;
  const conversionRate = totalOffers > 0 ? (acceptedOffers / totalOffers * 100) : 0;

  // Value metrics
  const totalValue = deals.reduce((sum, deal) => sum + (deal.paymentInfo.paymentAmount || 0), 0);
  const averageDealValue = totalDeals > 0 ? totalValue / totalDeals : 0;

  // Time metrics
  const dealDurations = deals
    .filter(d => d.status === 'completed' && d.createdAt && d.updatedAt)
    .map(d => (new Date(d.updatedAt) - new Date(d.createdAt)) / (1000 * 60 * 60 * 24));
  
  const averageDealDuration = dealDurations.length > 0 ? 
    dealDurations.reduce((sum, duration) => sum + duration, 0) / dealDurations.length : 0;

  // Payment metrics
  const totalEscrowed = deals.reduce((sum, deal) => sum + (deal.paymentInfo.totalEscrowed || 0), 0);
  const totalReleased = deals.reduce((sum, deal) => sum + (deal.paymentInfo.totalReleased || 0), 0);
  const pendingPayments = totalEscrowed - totalReleased;

  return {
    totalDeals,
    activeDeals,
    completedDeals,
    cancelledDeals,
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalValue: Math.round(totalValue),
    averageDealValue: Math.round(averageDealValue),
    averageDealDuration: Math.round(averageDealDuration),
    completionRate: totalDeals > 0 ? Math.round((completedDeals / totalDeals * 100) * 100) / 100 : 0,
    payments: {
      totalEscrowed: Math.round(totalEscrowed),
      totalReleased: Math.round(totalReleased),
      pendingPayments: Math.round(pendingPayments),
      releaseRate: totalEscrowed > 0 ? Math.round((totalReleased / totalEscrowed * 100) * 100) / 100 : 0
    }
  };
};

// Calculate performance metrics
const calculatePerformanceMetrics = (deals, offers, isMarketer) => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // This month's metrics
  const thisMonthDeals = deals.filter(d => new Date(d.createdAt) >= thisMonth);
  const thisMonthOffers = offers.filter(o => new Date(o.createdAt) >= thisMonth);

  // Last month's metrics
  const lastMonthDeals = deals.filter(d => 
    new Date(d.createdAt) >= lastMonth && new Date(d.createdAt) < thisMonth
  );
  const lastMonthOffers = offers.filter(o => 
    new Date(o.createdAt) >= lastMonth && new Date(o.createdAt) < thisMonth
  );

  // Calculate month-over-month changes
  const dealGrowth = lastMonthDeals.length > 0 ? 
    ((thisMonthDeals.length - lastMonthDeals.length) / lastMonthDeals.length * 100) : 0;
  
  const offerGrowth = lastMonthOffers.length > 0 ? 
    ((thisMonthOffers.length - lastMonthOffers.length) / lastMonthOffers.length * 100) : 0;

  // Value growth
  const thisMonthValue = thisMonthDeals.reduce((sum, d) => sum + (d.paymentInfo.paymentAmount || 0), 0);
  const lastMonthValue = lastMonthDeals.reduce((sum, d) => sum + (d.paymentInfo.paymentAmount || 0), 0);
  const valueGrowth = lastMonthValue > 0 ? 
    ((thisMonthValue - lastMonthValue) / lastMonthValue * 100) : 0;

  return {
    thisMonth: {
      deals: thisMonthDeals.length,
      offers: thisMonthOffers.length,
      value: Math.round(thisMonthValue)
    },
    lastMonth: {
      deals: lastMonthDeals.length,
      offers: lastMonthOffers.length,
      value: Math.round(lastMonthValue)
    },
    growth: {
      deals: Math.round(dealGrowth * 100) / 100,
      offers: Math.round(offerGrowth * 100) / 100,
      value: Math.round(valueGrowth * 100) / 100
    },
    trends: {
      improving: dealGrowth > 0 && valueGrowth > 0,
      declining: dealGrowth < 0 && valueGrowth < 0,
      mixed: (dealGrowth > 0 && valueGrowth < 0) || (dealGrowth < 0 && valueGrowth > 0)
    }
  };
};

// Calculate revenue projections
const calculateRevenueProjections = (deals, offers, timeframe) => {
  const currentDate = new Date();
  const projections = [];

  // Calculate monthly projections based on historical data
  for (let i = 1; i <= 12; i++) {
    const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    
    // Use historical trends to project future revenue
    const historicalAverage = deals.length > 0 ? 
      deals.reduce((sum, deal) => sum + (deal.paymentInfo.paymentAmount || 0), 0) / deals.length : 0;
    
    // Apply growth trends
    const growthFactor = 1.02; // Assume 2% monthly growth
    const projectedValue = historicalAverage * Math.pow(growthFactor, i);
    
    projections.push({
      month: projectionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      projectedRevenue: Math.round(projectedValue),
      confidence: Math.max(50, 90 - (i * 5)), // Decreasing confidence over time
      basedOn: 'historical_trends'
    });
  }

  return {
    projections,
    methodology: 'Based on historical deal patterns and 2% monthly growth assumption',
    totalProjected12Months: Math.round(projections.reduce((sum, p) => sum + p.projectedRevenue, 0)),
    averageMonthlyProjection: Math.round(projections.reduce((sum, p) => sum + p.projectedRevenue, 0) / projections.length)
  };
};

// Generate monthly breakdown
const generateMonthlyBreakdown = (deals, offers, startDate, endDate) => {
  const breakdown = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    
    const monthDeals = deals.filter(d => {
      const dealDate = new Date(d.createdAt);
      return dealDate >= monthStart && dealDate <= monthEnd;
    });
    
    const monthOffers = offers.filter(o => {
      const offerDate = new Date(o.createdAt);
      return offerDate >= monthStart && offerDate <= monthEnd;
    });
    
    const monthRevenue = monthDeals.reduce((sum, deal) => sum + (deal.paymentInfo.paymentAmount || 0), 0);
    
    breakdown.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      deals: monthDeals.length,
      offers: monthOffers.length,
      revenue: Math.round(monthRevenue),
      completedDeals: monthDeals.filter(d => d.status === 'completed').length,
      conversionRate: monthOffers.length > 0 ? 
        Math.round((monthDeals.length / monthOffers.length * 100) * 100) / 100 : 0
    });
    
    current.setMonth(current.getMonth() + 1);
  }
  
  return breakdown;
};

// Generate insights and recommendations
const generateDashboardInsights = (arr, dealMetrics, performance, isMarketer) => {
  const insights = [];
  
  // ARR insights
  if (arr.growthRate > 20) {
    insights.push({
      type: 'positive',
      category: 'growth',
      title: 'Strong ARR Growth',
      message: `Your ARR has grown by ${arr.growthRate}% this year`,
      action: 'Continue current strategies'
    });
  } else if (arr.growthRate < 0) {
    insights.push({
      type: 'warning',
      category: 'growth',
      title: 'ARR Decline',
      message: `ARR has decreased by ${Math.abs(arr.growthRate)}%`,
      action: 'Review deal strategy and pricing'
    });
  }
  
  // Deal performance insights
  if (dealMetrics.completionRate > 80) {
    insights.push({
      type: 'positive',
      category: 'performance',
      title: 'High Completion Rate',
      message: `${dealMetrics.completionRate}% of deals are completed successfully`,
      action: 'Maintain quality standards'
    });
  }
  
  // Conversion insights
  if (dealMetrics.conversionRate < 20) {
    insights.push({
      type: 'warning',
      category: 'conversion',
      title: 'Low Conversion Rate',
      message: `Only ${dealMetrics.conversionRate}% of offers convert to deals`,
      action: 'Improve offer targeting and terms'
    });
  }
  
  // Payment insights
  if (dealMetrics.payments.releaseRate < 70) {
    insights.push({
      type: 'alert',
      category: 'payments',
      title: 'Payment Release Issues',
      message: `Only ${dealMetrics.payments.releaseRate}% of escrowed funds released`,
      action: 'Review milestone completion process'
    });
  }
  
  // Trend insights
  if (performance.trends.improving) {
    insights.push({
      type: 'positive',
      category: 'trends',
      title: 'Positive Trends',
      message: 'Both deal volume and value are growing',
      action: 'Consider scaling operations'
    });
  } else if (performance.trends.declining) {
    insights.push({
      type: 'warning',
      category: 'trends',
      title: 'Declining Performance',
      message: 'Both deal volume and value are decreasing',
      action: 'Review strategy and market conditions'
    });
  }
  
  return insights;
};

module.exports = exports;