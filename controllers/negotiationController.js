const mongoose = require("mongoose");
const { successResponse, errorResponse, handleServerError } = require("../utils/responseHelper");

const Offer = require("../models/offer");
const User = require("../models/User");
const Notification = require("../models/Notification");

/**
 * Enhanced Negotiation Controller
 * Provides comprehensive negotiation table management and analysis
 */

// Helper function to calculate negotiation metrics
const calculateNegotiationMetrics = (offer) => {
  const metrics = {
    totalRounds: offer.counters.length,
    negotiationDuration: 0,
    amountTrend: "stable",
    timelineChanges: 0,
    lastActivity: null,
    convergenceScore: 0,
    recommendations: []
  };

  if (offer.counters.length === 0) {
    return metrics;
  }

  // Calculate duration
  const firstCounter = offer.counters[0];
  const lastCounter = offer.counters[offer.counters.length - 1];
  
  if (firstCounter && lastCounter) {
    const startDate = new Date(firstCounter.counterDate || offer.createdAt);
    const endDate = new Date(lastCounter.counterDate);
    metrics.negotiationDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)); // days
    metrics.lastActivity = endDate;
  }

  // Analyze amount trend
  if (offer.counters.length >= 2) {
    const amounts = offer.counters.map(c => c.counterAmount).filter(a => a);
    if (amounts.length >= 2) {
      const first = amounts[0];
      const last = amounts[amounts.length - 1];
      const percentChange = ((last - first) / first) * 100;
      
      if (Math.abs(percentChange) < 5) {
        metrics.amountTrend = "stable";
      } else if (percentChange > 0) {
        metrics.amountTrend = "increasing";
      } else {
        metrics.amountTrend = "decreasing";
      }
    }
  }

  // Calculate convergence score (0-100)
  if (offer.counters.length >= 3) {
    const recentCounters = offer.counters.slice(-3);
    const amounts = recentCounters.map(c => c.counterAmount).filter(a => a);
    
    if (amounts.length >= 2) {
      const variance = amounts.reduce((sum, amount, index, arr) => {
        if (index === 0) return 0;
        return sum + Math.abs(amount - arr[index - 1]);
      }, 0) / (amounts.length - 1);
      
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const variancePercent = (variance / avgAmount) * 100;
      
      metrics.convergenceScore = Math.max(0, 100 - variancePercent * 10);
    }
  }

  // Generate recommendations
  if (metrics.totalRounds >= 5) {
    metrics.recommendations.push("Consider direct communication to resolve remaining differences");
  }
  
  if (metrics.negotiationDuration > 7) {
    metrics.recommendations.push("Extended negotiation - consider setting a deadline");
  }
  
  if (metrics.convergenceScore > 80) {
    metrics.recommendations.push("Terms are converging - good time to finalize");
  } else if (metrics.convergenceScore < 30 && metrics.totalRounds >= 3) {
    metrics.recommendations.push("Consider alternative negotiation approach");
  }

  return metrics;
};

// Get comprehensive negotiation data with enhanced filtering (Bug #11)
exports.getNegotiationTable = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { 
      userId, 
      sortBy = 'counterDate', 
      sortOrder = 'desc',
      filterBy,
      filterValue,
      page = 1,
      limit = 20
    } = req.query;

    if (!offerId || !userId) {
      return errorResponse(res, "Missing offerId or userId", 400);
    }

    const offer = await Offer.findById(offerId)
      .populate("marketerId", "name email avatar userType")
      .populate("creatorId", "name email avatar userType");

    if (!offer) {
      return errorResponse(res, "Offer not found", 404);
    }

    // Verify user has access to this negotiation
    const hasAccess = String(offer.marketerId._id) === userId || 
                     String(offer.creatorId._id) === userId;
    
    if (!hasAccess) {
      return errorResponse(res, "Access denied", 403);
    }

    // Calculate metrics
    const metrics = calculateNegotiationMetrics(offer);

    // Process and filter negotiation history
    let negotiationHistory = offer.counters.map((counter, index) => {
      const previousAmount = index > 0 ? 
        offer.counters[index - 1].counterAmount || offer.proposedAmount : 
        offer.proposedAmount;
      
      return {
        id: counter._id,
        round: index + 1,
        counterBy: counter.counterBy,
        counterAmount: counter.counterAmount,
        proposedAmount: offer.proposedAmount,
        previousAmount,
        amountDifference: counter.counterAmount ? 
          counter.counterAmount - offer.proposedAmount : 0,
        amountChange: counter.counterAmount ? 
          counter.counterAmount - previousAmount : 0,
        amountChangePercentage: previousAmount ? 
          ((counter.counterAmount - previousAmount) / previousAmount * 100).toFixed(2) : 0,
        notes: counter.notes,
        counterDate: counter.counterDate,
        counterReviewDate: counter.counterReviewDate,
        counterPostDate: counter.counterPostDate,
        deliverables: counter.deliverables || offer.deliverables,
        isLatest: index === offer.counters.length - 1,
        priority: counter.priority || 'medium',
        expiresAt: counter.expiresAt,
        isExpired: counter.expiresAt ? new Date(counter.expiresAt) < new Date() : false,
        isMessage: counter.isMessage || false,
        isAcceptance: counter.isAcceptance || false,
        isRejection: counter.isRejection || false,
        attachments: counter.attachments || [],
        type: counter.isMessage ? 'message' : 
              counter.isAcceptance ? 'acceptance' : 
              counter.isRejection ? 'rejection' : 'counter'
      };
    });

    // Apply filtering
    if (filterBy && filterValue) {
      negotiationHistory = applyNegotiationFilter(negotiationHistory, filterBy, filterValue);
    }

    // Apply sorting
    negotiationHistory = applySorting(negotiationHistory, sortBy, sortOrder);

    // Apply pagination
    const totalItems = negotiationHistory.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = negotiationHistory.slice(startIndex, endIndex);

    // Generate summary statistics
    const summaryStats = generateNegotiationSummary(negotiationHistory, offer);

    // Current terms
    let currentTerms = {
      amount: offer.proposedAmount,
      reviewDate: offer.desiredReviewDate,
      postDate: offer.desiredPostDate,
      deliverables: offer.deliverables,
      notes: offer.notes
    };

    // Apply latest counter if exists
    if (offer.counters.length > 0) {
      const latestCounter = offer.counters[offer.counters.length - 1];
      currentTerms = {
        amount: latestCounter.counterAmount || currentTerms.amount,
        reviewDate: latestCounter.counterReviewDate || currentTerms.reviewDate,
        postDate: latestCounter.counterPostDate || currentTerms.postDate,
        deliverables: latestCounter.deliverables || currentTerms.deliverables,
        notes: latestCounter.notes || currentTerms.notes
      };
    }

    // Enhanced response data with filtering and sorting support
    const responseData = {
      offer: {
        id: offer._id,
        offerName: offer.offerName,
        description: offer.description,
        status: offer.status,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
        platforms: offer.platforms || [],
        currency: offer.currency || 'USD'
      },
      participants: {
        marketer: {
          id: offer.marketerId._id,
          name: offer.marketerId.name,
          email: offer.marketerId.email,
          avatar: offer.marketerId.avatar,
          userType: offer.marketerId.userType
        },
        creator: {
          id: offer.creatorId._id,
          name: offer.creatorId.name,
          email: offer.creatorId.email,
          avatar: offer.creatorId.avatar,
          userType: offer.creatorId.userType
        }
      },
      currentTerms,
      negotiationHistory: paginatedHistory,
      allHistory: negotiationHistory, // For analytics/charts
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      },
      sorting: {
        sortBy,
        sortOrder,
        availableSortFields: [
          'counterDate', 'counterAmount', 'round', 'priority', 
          'amountChange', 'amountChangePercentage', 'type'
        ]
      },
      filtering: {
        filterBy,
        filterValue,
        availableFilters: {
          type: ['counter', 'message', 'acceptance', 'rejection'],
          counterBy: ['Creator', 'Marketer'],
          priority: ['low', 'medium', 'high', 'urgent'],
          isExpired: ['true', 'false'],
          hasAttachments: ['true', 'false']
        }
      },
      summaryStats,
      metrics,
      permissions: {
        canCounter: offer.status !== "Accepted" && offer.status !== "Deal Created",
        canAccept: offer.status !== "Accepted" && offer.status !== "Deal Created",
        canReject: offer.status !== "Rejected" && offer.status !== "Deal Created",
        canFilter: true,
        canSort: true,
        canExport: true
      }
    };

    return successResponse(res, "Negotiation table retrieved successfully", responseData);

  } catch (error) {
    console.error("Error getting negotiation table:", error);
    return handleServerError(res, error);
  }
};

// Submit enhanced counter offer
exports.submitCounterOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const {
      userId,
      counterAmount,
      notes,
      counterReviewDate,
      counterPostDate,
      deliverables,
      priority = "medium",
      expiresIn = 7 // days
    } = req.body;

    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    const offer = await Offer.findById(offerId)
      .populate("marketerId", "name email deviceToken")
      .populate("creatorId", "name email deviceToken");

    if (!offer) {
      return errorResponse(res, "Offer not found", 404);
    }

    // Determine user role
    let counterBy = "";
    let otherParty = null;
    
    if (String(offer.creatorId._id) === userId) {
      counterBy = "Creator";
      otherParty = offer.marketerId;
    } else if (String(offer.marketerId._id) === userId) {
      counterBy = "Marketer";
      otherParty = offer.creatorId;
    } else {
      return errorResponse(res, "Access denied", 403);
    }

    // Validate counter offer data
    if (!counterAmount && !notes && !counterReviewDate && !counterPostDate && !deliverables) {
      return errorResponse(res, "At least one field must be provided for counter offer", 400);
    }

    // Add counter to offer
    const counterData = {
      counterBy,
      counterDate: new Date(),
      priority
    };

    // Only add fields that were provided
    if (counterAmount) counterData.counterAmount = counterAmount;
    if (notes) counterData.notes = notes;
    if (counterReviewDate) counterData.counterReviewDate = new Date(counterReviewDate);
    if (counterPostDate) counterData.counterPostDate = new Date(counterPostDate);
    if (deliverables) counterData.deliverables = deliverables;
    
    // Add expiration date
    if (expiresIn > 0) {
      counterData.expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);
    }

    offer.counters.push(counterData);
    offer.status = "Rejected-Countered";
    
    // Reset viewed status
    offer.viewedByCreator = false;
    offer.viewedByMarketer = false;
    
    await offer.save();

    // Create notification
    const notification = new Notification({
      userId: otherParty._id,
      type: "counter_offer",
      title: "New Counter Offer",
      message: `${counterBy} has submitted a counter offer for "${offer.offerName}"`,
      data: {
        offerId: offer._id,
        counterAmount: counterAmount,
        counterBy: counterBy
      }
    });
    await notification.save();

    // Calculate updated metrics
    const metrics = calculateNegotiationMetrics(offer);

    return successResponse(res, "Counter offer submitted successfully", {
      counter: counterData,
      offer: {
        id: offer._id,
        status: offer.status,
        countersCount: offer.counters.length
      },
      metrics
    });

  } catch (error) {
    console.error("Error submitting counter offer:", error);
    return handleServerError(res, error);
  }
};

// Accept current terms
exports.acceptNegotiation = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId, acceptedTerms } = req.body;

    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    const offer = await Offer.findById(offerId)
      .populate("marketerId", "name email deviceToken")
      .populate("creatorId", "name email deviceToken");

    if (!offer) {
      return errorResponse(res, "Offer not found", 404);
    }

    // Verify user has access
    const hasAccess = String(offer.marketerId._id) === userId || 
                     String(offer.creatorId._id) === userId;
    
    if (!hasAccess) {
      return errorResponse(res, "Access denied", 403);
    }

    // Determine acceptor role
    let acceptedBy = "";
    let otherParty = null;
    
    if (String(offer.creatorId._id) === userId) {
      acceptedBy = "Creator";
      otherParty = offer.marketerId;
    } else {
      acceptedBy = "Marketer";
      otherParty = offer.creatorId;
    }

    // Update offer status
    offer.status = "Accepted";
    
    // Record acceptance details
    const acceptanceRecord = {
      acceptedBy,
      acceptedAt: new Date(),
      acceptedTerms: acceptedTerms || {
        amount: offer.counters.length > 0 ? 
          offer.counters[offer.counters.length - 1].counterAmount || offer.proposedAmount :
          offer.proposedAmount,
        reviewDate: offer.counters.length > 0 ?
          offer.counters[offer.counters.length - 1].counterReviewDate || offer.desiredReviewDate :
          offer.desiredReviewDate,
        postDate: offer.counters.length > 0 ?
          offer.counters[offer.counters.length - 1].counterPostDate || offer.desiredPostDate :
          offer.desiredPostDate
      }
    };

    // Add acceptance record to counters for history
    offer.counters.push({
      counterBy: acceptedBy,
      counterDate: new Date(),
      notes: `Accepted negotiation terms`,
      isAcceptance: true,
      acceptedTerms: acceptanceRecord.acceptedTerms
    });

    await offer.save();

    // Create notification for other party
    const notification = new Notification({
      userId: otherParty._id,
      type: "offer_accepted",
      title: "Offer Accepted",
      message: `${acceptedBy} has accepted the negotiated terms for "${offer.offerName}"`,
      data: {
        offerId: offer._id,
        acceptedBy: acceptedBy,
        finalAmount: acceptanceRecord.acceptedTerms.amount
      }
    });
    await notification.save();

    return successResponse(res, "Negotiation accepted successfully", {
      offer: {
        id: offer._id,
        status: offer.status,
        finalTerms: acceptanceRecord.acceptedTerms
      },
      acceptance: acceptanceRecord
    });

  } catch (error) {
    console.error("Error accepting negotiation:", error);
    return handleServerError(res, error);
  }
};

// Reject negotiation
exports.rejectNegotiation = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId, reason } = req.body;

    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    const offer = await Offer.findById(offerId)
      .populate("marketerId", "name email deviceToken")
      .populate("creatorId", "name email deviceToken");

    if (!offer) {
      return errorResponse(res, "Offer not found", 404);
    }

    // Verify user has access
    const hasAccess = String(offer.marketerId._id) === userId || 
                     String(offer.creatorId._id) === userId;
    
    if (!hasAccess) {
      return errorResponse(res, "Access denied", 403);
    }

    // Determine rejector role
    let rejectedBy = "";
    let otherParty = null;
    
    if (String(offer.creatorId._id) === userId) {
      rejectedBy = "Creator";
      otherParty = offer.marketerId;
    } else {
      rejectedBy = "Marketer";
      otherParty = offer.creatorId;
    }

    // Update offer status
    offer.status = "Rejected";
    
    // Add rejection record
    offer.counters.push({
      counterBy: rejectedBy,
      counterDate: new Date(),
      notes: reason || `Negotiation rejected by ${rejectedBy}`,
      isRejection: true
    });

    await offer.save();

    // Create notification
    const notification = new Notification({
      userId: otherParty._id,
      type: "offer_rejected",
      title: "Negotiation Rejected",
      message: `${rejectedBy} has rejected the negotiation for "${offer.offerName}"`,
      data: {
        offerId: offer._id,
        rejectedBy: rejectedBy,
        reason: reason
      }
    });
    await notification.save();

    return successResponse(res, "Negotiation rejected", {
      offer: {
        id: offer._id,
        status: offer.status
      },
      rejection: {
        rejectedBy,
        rejectedAt: new Date(),
        reason: reason
      }
    });

  } catch (error) {
    console.error("Error rejecting negotiation:", error);
    return handleServerError(res, error);
  }
};

// Get negotiation analytics
exports.getNegotiationAnalytics = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    // Get all offers for the user
    const offers = await Offer.find({
      $or: [
        { marketerId: userId },
        { creatorId: userId }
      ]
    });

    const analytics = {
      totalNegotiations: 0,
      acceptedNegotiations: 0,
      rejectedNegotiations: 0,
      activeNegotiations: 0,
      averageRounds: 0,
      averageDuration: 0,
      successRate: 0,
      totalCounters: 0,
      byRole: {
        asMarketer: { total: 0, accepted: 0, rejected: 0 },
        asCreator: { total: 0, accepted: 0, rejected: 0 }
      },
      monthlyTrends: []
    };

    let totalRounds = 0;
    let totalDuration = 0;
    let negotiationsWithCounters = 0;

    offers.forEach(offer => {
      if (offer.counters.length === 0) return; // Skip offers without negotiation
      
      analytics.totalNegotiations++;
      analytics.totalCounters += offer.counters.length;
      totalRounds += offer.counters.length;

      // Role-based analytics
      const isMarketer = String(offer.marketerId) === userId;
      const roleKey = isMarketer ? 'asMarketer' : 'asCreator';
      analytics.byRole[roleKey].total++;

      // Status analytics
      if (offer.status === "Accepted") {
        analytics.acceptedNegotiations++;
        analytics.byRole[roleKey].accepted++;
      } else if (offer.status === "Rejected") {
        analytics.rejectedNegotiations++;
        analytics.byRole[roleKey].rejected++;
      } else {
        analytics.activeNegotiations++;
      }

      // Duration calculation
      if (offer.counters.length > 0) {
        const firstCounter = offer.counters[0];
        const lastCounter = offer.counters[offer.counters.length - 1];
        
        if (firstCounter.counterDate && lastCounter.counterDate) {
          const duration = (new Date(lastCounter.counterDate) - new Date(firstCounter.counterDate)) / (1000 * 60 * 60 * 24);
          totalDuration += duration;
          negotiationsWithCounters++;
        }
      }
    });

    // Calculate averages
    if (analytics.totalNegotiations > 0) {
      analytics.averageRounds = Math.round(totalRounds / analytics.totalNegotiations * 10) / 10;
      analytics.successRate = Math.round((analytics.acceptedNegotiations / analytics.totalNegotiations) * 100);
    }

    if (negotiationsWithCounters > 0) {
      analytics.averageDuration = Math.round(totalDuration / negotiationsWithCounters * 10) / 10;
    }

    return successResponse(res, "Negotiation analytics retrieved successfully", analytics);

  } catch (error) {
    console.error("Error getting negotiation analytics:", error);
    return handleServerError(res, error);
  }
};

// Add negotiation message/note
exports.addNegotiationMessage = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId, message, isInternal = false } = req.body;

    if (!userId || !message) {
      return errorResponse(res, "userId and message are required", 400);
    }

    const offer = await Offer.findById(offerId)
      .populate("marketerId", "name email")
      .populate("creatorId", "name email");

    if (!offer) {
      return errorResponse(res, "Offer not found", 404);
    }

    // Verify user has access
    const hasAccess = String(offer.marketerId._id) === userId || 
                     String(offer.creatorId._id) === userId;
    
    if (!hasAccess) {
      return errorResponse(res, "Access denied", 403);
    }

    // Determine user role
    let messageBy = "";
    if (String(offer.creatorId._id) === userId) {
      messageBy = "Creator";
    } else {
      messageBy = "Marketer";
    }

    // Add message as a special counter entry
    const messageEntry = {
      counterBy: messageBy,
      counterDate: new Date(),
      notes: message,
      isMessage: true,
      isInternal: isInternal
    };

    offer.counters.push(messageEntry);
    await offer.save();

    return successResponse(res, "Message added successfully", {
      message: messageEntry,
      offer: {
        id: offer._id,
        countersCount: offer.counters.length
      }
    });

  } catch (error) {
    console.error("Error adding negotiation message:", error);
    return handleServerError(res, error);
  }
};

// Get visual diff comparison between offer versions (Bug #9)
exports.getOfferVisualDiff = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { compareVersions, userId } = req.query;

    if (!offerId || !userId) {
      return errorResponse(res, "Missing offerId or userId", 400);
    }

    const offer = await Offer.findById(offerId)
      .populate("marketerId", "name email avatar")
      .populate("creatorId", "name email avatar");

    if (!offer) {
      return errorResponse(res, "Offer not found", 404);
    }

    // Verify user has access
    const hasAccess = String(offer.marketerId._id) === userId || 
                     String(offer.creatorId._id) === userId;
    
    if (!hasAccess) {
      return errorResponse(res, "Access denied", 403);
    }

    // Determine comparison versions
    let baseVersion, comparisonVersion;
    
    if (compareVersions) {
      const [baseIndex, comparisonIndex] = compareVersions.split(',').map(Number);
      
      // Version 0 is original offer, subsequent versions are counters
      baseVersion = baseIndex === 0 ? 
        getOriginalOfferTerms(offer) : 
        getCounterTerms(offer, baseIndex - 1);
        
      comparisonVersion = comparisonIndex === 0 ? 
        getOriginalOfferTerms(offer) : 
        getCounterTerms(offer, comparisonIndex - 1);
    } else {
      // Default: compare original vs latest
      baseVersion = getOriginalOfferTerms(offer);
      comparisonVersion = getLatestTerms(offer);
    }

    if (!baseVersion || !comparisonVersion) {
      return errorResponse(res, "Invalid comparison versions", 400);
    }

    // Generate visual diff
    const visualDiff = generateVisualDiff(baseVersion, comparisonVersion);
    
    // Generate timeline data
    const timeline = generateNegotiationTimeline(offer);

    return successResponse(res, "Visual diff generated successfully", {
      baseVersion,
      comparisonVersion,
      visualDiff,
      timeline,
      metadata: {
        totalVersions: offer.counters.length + 1, // +1 for original
        baseVersionIndex: parseInt(compareVersions?.split(',')[0]) || 0,
        comparisonVersionIndex: parseInt(compareVersions?.split(',')[1]) || offer.counters.length,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Error generating visual diff:", error);
    return handleServerError(res, error);
  }
};

// Helper function to get original offer terms
const getOriginalOfferTerms = (offer) => {
  return {
    version: 0,
    type: 'original',
    createdBy: 'Marketer',
    createdAt: offer.createdAt,
    terms: {
      amount: offer.proposedAmount,
      reviewDate: offer.desiredReviewDate,
      postDate: offer.desiredPostDate,
      deliverables: offer.deliverables || [],
      platforms: offer.platforms || [],
      description: offer.description,
      notes: offer.notes
    },
    metadata: {
      offerName: offer.offerName,
      currency: offer.currency || 'USD'
    }
  };
};

// Helper function to get counter terms
const getCounterTerms = (offer, counterIndex) => {
  if (counterIndex >= offer.counters.length) return null;
  
  const counter = offer.counters[counterIndex];
  const previousTerms = counterIndex === 0 ? 
    getOriginalOfferTerms(offer).terms : 
    getCounterTerms(offer, counterIndex - 1).terms;

  return {
    version: counterIndex + 1,
    type: 'counter',
    createdBy: counter.counterBy,
    createdAt: counter.counterDate,
    terms: {
      amount: counter.counterAmount || previousTerms.amount,
      reviewDate: counter.counterReviewDate || previousTerms.reviewDate,
      postDate: counter.counterPostDate || previousTerms.postDate,
      deliverables: counter.deliverables || previousTerms.deliverables,
      platforms: previousTerms.platforms, // Platforms typically don't change in counters
      description: previousTerms.description,
      notes: counter.notes || previousTerms.notes
    },
    metadata: {
      priority: counter.priority,
      expiresAt: counter.expiresAt,
      isLatest: counterIndex === offer.counters.length - 1,
      isMessage: counter.isMessage,
      isAcceptance: counter.isAcceptance,
      isRejection: counter.isRejection
    }
  };
};

// Helper function to get latest terms
const getLatestTerms = (offer) => {
  if (offer.counters.length === 0) {
    return getOriginalOfferTerms(offer);
  }
  return getCounterTerms(offer, offer.counters.length - 1);
};

// Helper function to generate visual diff
const generateVisualDiff = (baseVersion, comparisonVersion) => {
  const diff = {
    changes: [],
    summary: {
      totalChanges: 0,
      fieldChanges: 0,
      significantChanges: 0
    }
  };

  const compareFields = [
    { key: 'amount', label: 'Amount', type: 'currency', significant: true },
    { key: 'reviewDate', label: 'Review Date', type: 'date', significant: true },
    { key: 'postDate', label: 'Post Date', type: 'date', significant: true },
    { key: 'deliverables', label: 'Deliverables', type: 'array', significant: true },
    { key: 'platforms', label: 'Platforms', type: 'array', significant: false },
    { key: 'notes', label: 'Notes', type: 'text', significant: false }
  ];

  compareFields.forEach(field => {
    const baseValue = baseVersion.terms[field.key];
    const comparisonValue = comparisonVersion.terms[field.key];
    
    let hasChanged = false;
    let changeType = 'none';
    let percentageChange = null;

    // Compare values based on type
    if (field.type === 'currency' && baseValue !== comparisonValue) {
      hasChanged = true;
      changeType = comparisonValue > baseValue ? 'increase' : 'decrease';
      percentageChange = baseValue ? ((comparisonValue - baseValue) / baseValue * 100).toFixed(2) : null;
    } else if (field.type === 'date') {
      const baseDate = new Date(baseValue);
      const comparisonDate = new Date(comparisonValue);
      if (baseDate.getTime() !== comparisonDate.getTime()) {
        hasChanged = true;
        changeType = comparisonDate > baseDate ? 'later' : 'earlier';
      }
    } else if (field.type === 'array') {
      const baseArray = Array.isArray(baseValue) ? baseValue : [];
      const comparisonArray = Array.isArray(comparisonValue) ? comparisonValue : [];
      
      if (JSON.stringify(baseArray.sort()) !== JSON.stringify(comparisonArray.sort())) {
        hasChanged = true;
        changeType = comparisonArray.length > baseArray.length ? 'additions' : 
                    comparisonArray.length < baseArray.length ? 'removals' : 'modifications';
      }
    } else if (field.type === 'text' && baseValue !== comparisonValue) {
      hasChanged = true;
      changeType = 'modified';
    }

    if (hasChanged) {
      diff.changes.push({
        field: field.key,
        label: field.label,
        type: field.type,
        changeType,
        significant: field.significant,
        baseValue,
        comparisonValue,
        percentageChange,
        highlighted: field.significant,
        visual: {
          color: field.significant ? (changeType === 'increase' || changeType === 'later' || changeType === 'additions' ? '#22c55e' : '#ef4444') : '#6b7280',
          icon: getChangeIcon(changeType),
          badge: field.significant ? 'important' : 'minor'
        }
      });

      diff.summary.totalChanges++;
      if (field.significant) diff.summary.significantChanges++;
      diff.summary.fieldChanges++;
    }
  });

  return diff;
};

// Helper function to generate negotiation timeline
const generateNegotiationTimeline = (offer) => {
  const timeline = [];

  // Add original offer
  timeline.push({
    id: 'original',
    version: 0,
    type: 'original_offer',
    title: 'Original Offer',
    actor: 'Marketer',
    actorName: offer.marketerId.name,
    actorAvatar: offer.marketerId.avatar,
    timestamp: offer.createdAt,
    description: `Initial offer of $${offer.proposedAmount} proposed`,
    changes: [],
    status: 'completed',
    visual: {
      color: '#3b82f6',
      icon: '📝',
      position: 'left'
    }
  });

  // Add counter offers
  offer.counters.forEach((counter, index) => {
    const isCreator = counter.counterBy === 'Creator';
    const actor = isCreator ? offer.creatorId : offer.marketerId;
    
    let type = 'counter_offer';
    let title = 'Counter Offer';
    let description = `Counter offer submitted`;
    let icon = '🔄';
    let color = '#8b5cf6';

    if (counter.isMessage) {
      type = 'message';
      title = 'Message';
      description = `Added negotiation note`;
      icon = '💬';
      color = '#6b7280';
    } else if (counter.isAcceptance) {
      type = 'acceptance';
      title = 'Accepted';
      description = `Terms accepted`;
      icon = '✅';
      color = '#22c55e';
    } else if (counter.isRejection) {
      type = 'rejection';
      title = 'Rejected';
      description = `Negotiation rejected`;
      icon = '❌';
      color = '#ef4444';
    } else if (counter.counterAmount) {
      description = `Counter offer of $${counter.counterAmount}`;
    }

    // Detect changes for this counter
    const changes = [];
    const previousTerms = index === 0 ? 
      getOriginalOfferTerms(offer).terms : 
      getCounterTerms(offer, index - 1).terms;

    if (counter.counterAmount && counter.counterAmount !== previousTerms.amount) {
      changes.push({
        field: 'amount',
        from: previousTerms.amount,
        to: counter.counterAmount,
        type: 'currency'
      });
    }

    if (counter.counterReviewDate && counter.counterReviewDate !== previousTerms.reviewDate) {
      changes.push({
        field: 'reviewDate',
        from: previousTerms.reviewDate,
        to: counter.counterReviewDate,
        type: 'date'
      });
    }

    if (counter.counterPostDate && counter.counterPostDate !== previousTerms.postDate) {
      changes.push({
        field: 'postDate',
        from: previousTerms.postDate,
        to: counter.counterPostDate,
        type: 'date'
      });
    }

    timeline.push({
      id: counter._id,
      version: index + 1,
      type,
      title,
      actor: counter.counterBy,
      actorName: actor.name,
      actorAvatar: actor.avatar,
      timestamp: counter.counterDate,
      description,
      notes: counter.notes,
      changes,
      status: 'completed',
      metadata: {
        priority: counter.priority,
        expiresAt: counter.expiresAt,
        isLatest: index === offer.counters.length - 1
      },
      visual: {
        color,
        icon,
        position: isCreator ? 'right' : 'left'
      }
    });
  });

  return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// Helper function to get change icon
const getChangeIcon = (changeType) => {
  const iconMap = {
    'increase': '📈',
    'decrease': '📉',
    'later': '⏰',
    'earlier': '⏪',
    'additions': '➕',
    'removals': '➖',
    'modifications': '✏️',
    'modified': '✏️'
  };
  return iconMap[changeType] || '🔄';
};

// Helper function to apply filtering to negotiation history (Bug #11)
const applyNegotiationFilter = (history, filterBy, filterValue) => {
  return history.filter(item => {
    switch (filterBy) {
      case 'type':
        return item.type === filterValue;
      case 'counterBy':
        return item.counterBy === filterValue;
      case 'priority':
        return item.priority === filterValue;
      case 'isExpired':
        return item.isExpired.toString() === filterValue;
      case 'hasAttachments':
        return (item.attachments.length > 0).toString() === filterValue;
      case 'amountRange':
        const [min, max] = filterValue.split('-').map(Number);
        return item.counterAmount >= min && item.counterAmount <= max;
      case 'dateRange':
        const [startDate, endDate] = filterValue.split(',');
        const itemDate = new Date(item.counterDate);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      default:
        return true;
    }
  });
};

// Helper function to apply sorting to negotiation history
const applySorting = (history, sortBy, sortOrder) => {
  const order = sortOrder.toLowerCase() === 'desc' ? -1 : 1;
  
  return history.sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'counterDate':
        valueA = new Date(a.counterDate);
        valueB = new Date(b.counterDate);
        break;
      case 'counterAmount':
        valueA = a.counterAmount || 0;
        valueB = b.counterAmount || 0;
        break;
      case 'round':
        valueA = a.round;
        valueB = b.round;
        break;
      case 'amountChange':
        valueA = a.amountChange || 0;
        valueB = b.amountChange || 0;
        break;
      case 'amountChangePercentage':
        valueA = parseFloat(a.amountChangePercentage) || 0;
        valueB = parseFloat(b.amountChangePercentage) || 0;
        break;
      case 'priority':
        const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 };
        valueA = priorityOrder[a.priority] || 2;
        valueB = priorityOrder[b.priority] || 2;
        break;
      case 'type':
        valueA = a.type;
        valueB = b.type;
        break;
      default:
        valueA = a.counterDate;
        valueB = b.counterDate;
    }
    
    if (valueA < valueB) return -1 * order;
    if (valueA > valueB) return 1 * order;
    return 0;
  });
};

// Helper function to generate summary statistics
const generateNegotiationSummary = (history, offer) => {
  const summary = {
    totalRounds: history.length,
    counterOffers: history.filter(h => h.type === 'counter').length,
    messages: history.filter(h => h.type === 'message').length,
    acceptances: history.filter(h => h.type === 'acceptance').length,
    rejections: history.filter(h => h.type === 'rejection').length,
    
    // Amount statistics
    amounts: {
      initial: offer.proposedAmount,
      current: history.length > 0 ? 
        history[history.length - 1].counterAmount || offer.proposedAmount : 
        offer.proposedAmount,
      highest: Math.max(offer.proposedAmount, ...history.map(h => h.counterAmount || 0)),
      lowest: Math.min(offer.proposedAmount, ...history.map(h => h.counterAmount || offer.proposedAmount).filter(a => a > 0)),
      average: history.length > 0 ? 
        history.filter(h => h.counterAmount).reduce((sum, h) => sum + h.counterAmount, 0) / history.filter(h => h.counterAmount).length : 
        offer.proposedAmount
    },
    
    // Participation statistics
    participation: {
      creatorRounds: history.filter(h => h.counterBy === 'Creator').length,
      marketerRounds: history.filter(h => h.counterBy === 'Marketer').length,
      lastActionBy: history.length > 0 ? history[history.length - 1].counterBy : 'Marketer'
    },
    
    // Time statistics
    timing: {
      firstCounter: history.length > 0 ? history[0].counterDate : null,
      lastCounter: history.length > 0 ? history[history.length - 1].counterDate : null,
      averageResponseTime: calculateAverageResponseTime(history),
      totalDuration: calculateTotalNegotiationDuration(history, offer.createdAt)
    },
    
    // Priority distribution
    priorities: {
      urgent: history.filter(h => h.priority === 'urgent').length,
      high: history.filter(h => h.priority === 'high').length,
      medium: history.filter(h => h.priority === 'medium').length,
      low: history.filter(h => h.priority === 'low').length
    },
    
    // Status indicators
    status: {
      hasExpiredCounters: history.some(h => h.isExpired),
      hasAttachments: history.some(h => h.attachments.length > 0),
      lastActivity: history.length > 0 ? history[history.length - 1].counterDate : offer.createdAt,
      isStale: history.length > 0 ? 
        (new Date() - new Date(history[history.length - 1].counterDate)) > (7 * 24 * 60 * 60 * 1000) : 
        false
    }
  };
  
  return summary;
};

// Calculate average response time between counters
const calculateAverageResponseTime = (history) => {
  if (history.length < 2) return 0;
  
  const responseTimes = [];
  for (let i = 1; i < history.length; i++) {
    const currentDate = new Date(history[i].counterDate);
    const previousDate = new Date(history[i - 1].counterDate);
    const responseTime = (currentDate - previousDate) / (1000 * 60 * 60); // hours
    responseTimes.push(responseTime);
  }
  
  return responseTimes.length > 0 ? 
    Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length * 100) / 100 : 
    0;
};

// Calculate total negotiation duration
const calculateTotalNegotiationDuration = (history, offerCreatedAt) => {
  if (history.length === 0) return 0;
  
  const startDate = new Date(offerCreatedAt);
  const endDate = new Date(history[history.length - 1].counterDate);
  
  return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24) * 100) / 100; // days
};

// Get all comments for an offer
exports.getOfferComments = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user?.id || req.body?.userId || req.query?.userId;

    if (!userId) {
      return errorResponse(res, 401, "User ID is required");
    }

    const offer = await Offer.findById(offerId)
      .populate({
        path: 'comments.userId',
        select: 'name email profileImage'
      })
      .select('comments marketerId creatorId');

    if (!offer) {
      return errorResponse(res, 404, "Offer not found");
    }

    // Check if user has access to this offer
    const isMarketer = offer.marketerId.toString() === userId;
    const isCreator = offer.creatorId.toString() === userId;
    
    if (!isMarketer && !isCreator) {
      return errorResponse(res, 403, "You don't have access to this offer");
    }

    // Format comments for response
    const formattedComments = offer.comments.map(comment => ({
      id: comment._id,
      userId: comment.userId._id,
      userName: comment.userId.name,
      userEmail: comment.userId.email,
      userImage: comment.userId.profileImage,
      userRole: comment.userRole,
      comment: comment.comment,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isEdited: comment.isEdited,
      editHistory: comment.editHistory,
      isOwnComment: comment.userId._id.toString() === userId
    }));

    return successResponse(res, 200, "Comments retrieved successfully", {
      comments: formattedComments,
      totalComments: formattedComments.length
    });
  } catch (error) {
    return handleServerError(res, error);
  }
};

// Add a new comment to an offer
exports.addOfferComment = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id || req.body?.userId || req.query?.userId;

    if (!userId) {
      return errorResponse(res, 401, "User ID is required");
    }

    if (!comment || comment.trim().length === 0) {
      return errorResponse(res, 400, "Comment cannot be empty");
    }

    if (comment.length > 500) {
      return errorResponse(res, 400, "Comment exceeds maximum length of 500 characters");
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return errorResponse(res, 404, "Offer not found");
    }

    // Check if user has access to this offer
    const isMarketer = offer.marketerId.toString() === userId;
    const isCreator = offer.creatorId.toString() === userId;
    
    if (!isMarketer && !isCreator) {
      return errorResponse(res, 403, "You don't have access to this offer");
    }

    // Determine user role
    const userRole = isMarketer ? 'marketer' : 'creator';

    // Add comment to offer
    const newComment = {
      userId: userId,
      userRole: userRole,
      comment: comment.trim(),
      createdAt: new Date(),
      isEdited: false,
      editHistory: []
    };

    offer.comments.push(newComment);
    offer.negotiationMetrics.lastActivity = new Date();
    
    await offer.save();

    // Get the newly added comment with populated user data
    const updatedOffer = await Offer.findById(offerId)
      .populate({
        path: 'comments.userId',
        select: 'name email profileImage'
      });

    const addedComment = updatedOffer.comments[updatedOffer.comments.length - 1];

    // Send notification to the other party
    const recipientId = isMarketer ? offer.creatorId : offer.marketerId;
    const notification = new Notification({
      recipientId: recipientId,
      type: 'negotiation_comment',
      message: `New comment on offer "${offer.offerName}"`,
      relatedOfferId: offer._id
    });
    await notification.save();

    return successResponse(res, 201, "Comment added successfully", {
      comment: {
        id: addedComment._id,
        userId: addedComment.userId._id,
        userName: addedComment.userId.name,
        userEmail: addedComment.userId.email,
        userImage: addedComment.userId.profileImage,
        userRole: addedComment.userRole,
        comment: addedComment.comment,
        createdAt: addedComment.createdAt,
        isEdited: addedComment.isEdited,
        isOwnComment: true
      }
    });
  } catch (error) {
    return handleServerError(res, error);
  }
};

// Update an existing comment
exports.updateOfferComment = async (req, res) => {
  try {
    const { offerId, commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id || req.body?.userId || req.query?.userId;

    if (!userId) {
      return errorResponse(res, 401, "User ID is required");
    }

    if (!comment || comment.trim().length === 0) {
      return errorResponse(res, 400, "Comment cannot be empty");
    }

    if (comment.length > 500) {
      return errorResponse(res, 400, "Comment exceeds maximum length of 500 characters");
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return errorResponse(res, 404, "Offer not found");
    }

    // Find the comment
    const commentIndex = offer.comments.findIndex(c => c._id.toString() === commentId);
    if (commentIndex === -1) {
      return errorResponse(res, 404, "Comment not found");
    }

    const existingComment = offer.comments[commentIndex];

    // Check if user owns this comment
    if (existingComment.userId.toString() !== userId) {
      return errorResponse(res, 403, "You can only edit your own comments");
    }

    // Save previous version to edit history
    existingComment.editHistory.push({
      editedAt: new Date(),
      previousComment: existingComment.comment
    });

    // Update comment
    existingComment.comment = comment.trim();
    existingComment.updatedAt = new Date();
    existingComment.isEdited = true;

    await offer.save();

    // Get updated comment with populated user data
    const updatedOffer = await Offer.findById(offerId)
      .populate({
        path: 'comments.userId',
        select: 'name email profileImage'
      });

    const updatedComment = updatedOffer.comments[commentIndex];

    return successResponse(res, 200, "Comment updated successfully", {
      comment: {
        id: updatedComment._id,
        userId: updatedComment.userId._id,
        userName: updatedComment.userId.name,
        userEmail: updatedComment.userId.email,
        userImage: updatedComment.userId.profileImage,
        userRole: updatedComment.userRole,
        comment: updatedComment.comment,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
        isEdited: updatedComment.isEdited,
        editHistory: updatedComment.editHistory,
        isOwnComment: true
      }
    });
  } catch (error) {
    return handleServerError(res, error);
  }
};

// Delete a comment
exports.deleteOfferComment = async (req, res) => {
  try {
    const { offerId, commentId } = req.params;
    const userId = req.user?.id || req.body?.userId || req.query?.userId;

    if (!userId) {
      return errorResponse(res, 401, "User ID is required");
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return errorResponse(res, 404, "Offer not found");
    }

    // Find the comment
    const commentIndex = offer.comments.findIndex(c => c._id.toString() === commentId);
    if (commentIndex === -1) {
      return errorResponse(res, 404, "Comment not found");
    }

    const comment = offer.comments[commentIndex];

    // Check if user owns this comment
    if (comment.userId.toString() !== userId) {
      return errorResponse(res, 403, "You can only delete your own comments");
    }

    // Remove comment
    offer.comments.splice(commentIndex, 1);
    await offer.save();

    return successResponse(res, 200, "Comment deleted successfully", {
      deletedCommentId: commentId
    });
  } catch (error) {
    return handleServerError(res, error);
  }
};

module.exports = exports;