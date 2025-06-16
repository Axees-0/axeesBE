const User = require('../models/User');
const Deal = require('../models/deal');
const Offer = require('../models/offer');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');

/**
 * Calendar Controller
 * Handles calendar events from deals and offers for users
 */

// Get calendar events for a user (deals and offers combined)
exports.getCalendarEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, eventTypes, view = 'month' } = req.query;
    
    // Validate date range if provided
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    // Get user to determine role
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Build queries based on user role
    const dealQuery = {
      $or: [
        { marketerId: userId },  // User is the marketer
        { creatorId: userId }    // User is the creator
      ]
    };
    
    const offerQuery = {
      $or: [
        { marketerId: userId },
        { creatorId: userId }
      ]
    };

    // Get deals and offers
    const [deals, offers] = await Promise.all([
      Deal.find(dealQuery)
        .populate('marketerId', 'name userName')
        .populate('creatorId', 'name userName')
        .select('dealName marketerId creatorId status milestones desiredReviewDate desiredPostDate createdAt updatedAt'),
      Offer.find(offerQuery)
        .populate('marketerId', 'name userName')
        .populate('creatorId', 'name userName')
        .select('offerName marketerId creatorId status desiredReviewDate desiredPostDate startDate endDate createdAt updatedAt trialDetails counters')
    ]);

    // Process calendar events
    const events = [];

    // Process Deal events
    for (const deal of deals) {
      const isMarketer = deal.marketerId._id.toString() === userId;
      const otherParty = isMarketer ? deal.creatorId : deal.marketerId;

      // Milestone events
      if (deal.milestones && deal.milestones.length > 0) {
        for (const milestone of deal.milestones) {
          if (milestone.dueDate) {
            // Apply date filter if specified
            if (dateFilter.$gte && new Date(milestone.dueDate) < dateFilter.$gte) continue;
            if (dateFilter.$lte && new Date(milestone.dueDate) > dateFilter.$lte) continue;

            events.push({
              id: `milestone-${milestone._id}`,
              title: `${milestone.name} - ${deal.dealName}`,
              type: 'milestone',
              subType: milestone.label,
              date: milestone.dueDate,
              status: milestone.status,
              dealId: deal._id,
              milestoneId: milestone._id,
              amount: milestone.amount,
              percentage: milestone.percentage,
              description: `${milestone.label} for ${deal.dealName}`,
              participants: {
                marketer: deal.marketerId,
                creator: deal.creatorId,
                otherParty: otherParty
              },
              userRole: isMarketer ? 'marketer' : 'creator',
              priority: getPriorityByStatus(milestone.status),
              color: getColorByType('milestone', milestone.status),
              icon: getMilestoneIcon(milestone.label),
              metadata: {
                deliverables: milestone.deliverables || [],
                order: milestone.order,
                autoReleaseDate: milestone.autoReleaseDate
              }
            });
          }

          // Auto-release events
          if (milestone.autoReleaseDate) {
            if (dateFilter.$gte && new Date(milestone.autoReleaseDate) < dateFilter.$gte) continue;
            if (dateFilter.$lte && new Date(milestone.autoReleaseDate) > dateFilter.$lte) continue;

            events.push({
              id: `auto-release-${milestone._id}`,
              title: `Auto-Release: ${milestone.name}`,
              type: 'auto_release',
              subType: 'payment_release',
              date: milestone.autoReleaseDate,
              status: 'scheduled',
              dealId: deal._id,
              milestoneId: milestone._id,
              amount: milestone.amount,
              description: `Automatic payment release for ${milestone.name}`,
              participants: {
                marketer: deal.marketerId,
                creator: deal.creatorId,
                otherParty: otherParty
              },
              userRole: isMarketer ? 'marketer' : 'creator',
              priority: 'high',
              color: '#FF9500',
              icon: '⏰',
              metadata: {
                milestoneOrder: milestone.order,
                milestoneName: milestone.name
              }
            });
          }
        }
      }

      // Deal review date
      if (deal.desiredReviewDate) {
        if (!dateFilter.$gte || new Date(deal.desiredReviewDate) >= dateFilter.$gte) {
          if (!dateFilter.$lte || new Date(deal.desiredReviewDate) <= dateFilter.$lte) {
            events.push({
              id: `deal-review-${deal._id}`,
              title: `Review Content - ${deal.dealName}`,
              type: 'review',
              subType: 'content_review',
              date: deal.desiredReviewDate,
              status: deal.status,
              dealId: deal._id,
              description: `Content review for ${deal.dealName}`,
              participants: {
                marketer: deal.marketerId,
                creator: deal.creatorId,
                otherParty: otherParty
              },
              userRole: isMarketer ? 'marketer' : 'creator',
              priority: 'medium',
              color: '#007AFF',
              icon: '📝'
            });
          }
        }
      }

      // Deal post date
      if (deal.desiredPostDate) {
        if (!dateFilter.$gte || new Date(deal.desiredPostDate) >= dateFilter.$gte) {
          if (!dateFilter.$lte || new Date(deal.desiredPostDate) <= dateFilter.$lte) {
            events.push({
              id: `deal-post-${deal._id}`,
              title: `Post Content - ${deal.dealName}`,
              type: 'post',
              subType: 'content_post',
              date: deal.desiredPostDate,
              status: deal.status,
              dealId: deal._id,
              description: `Content posting for ${deal.dealName}`,
              participants: {
                marketer: deal.marketerId,
                creator: deal.creatorId,
                otherParty: otherParty
              },
              userRole: isMarketer ? 'marketer' : 'creator',
              priority: 'high',
              color: '#34C759',
              icon: '📱'
            });
          }
        }
      }
    }

    // Process Offer events
    for (const offer of offers) {
      const isMarketer = offer.marketerId._id.toString() === userId;
      const otherParty = isMarketer ? offer.creatorId : offer.marketerId;

      // Offer review date
      if (offer.desiredReviewDate) {
        if (!dateFilter.$gte || new Date(offer.desiredReviewDate) >= dateFilter.$gte) {
          if (!dateFilter.$lte || new Date(offer.desiredReviewDate) <= dateFilter.$lte) {
            events.push({
              id: `offer-review-${offer._id}`,
              title: `Review - ${offer.offerName}`,
              type: 'review',
              subType: 'offer_review',
              date: offer.desiredReviewDate,
              status: offer.status,
              offerId: offer._id,
              description: `Review for offer: ${offer.offerName}`,
              participants: {
                marketer: offer.marketerId,
                creator: offer.creatorId,
                otherParty: otherParty
              },
              userRole: isMarketer ? 'marketer' : 'creator',
              priority: 'medium',
              color: '#007AFF',
              icon: '👀'
            });
          }
        }
      }

      // Offer post date
      if (offer.desiredPostDate) {
        if (!dateFilter.$gte || new Date(offer.desiredPostDate) >= dateFilter.$gte) {
          if (!dateFilter.$lte || new Date(offer.desiredPostDate) <= dateFilter.$lte) {
            events.push({
              id: `offer-post-${offer._id}`,
              title: `Post - ${offer.offerName}`,
              type: 'post',
              subType: 'offer_post',
              date: offer.desiredPostDate,
              status: offer.status,
              offerId: offer._id,
              description: `Post content for: ${offer.offerName}`,
              participants: {
                marketer: offer.marketerId,
                creator: offer.creatorId,
                otherParty: otherParty
              },
              userRole: isMarketer ? 'marketer' : 'creator',
              priority: 'high',
              color: '#34C759',
              icon: '📲'
            });
          }
        }
      }

      // Campaign start/end dates
      if (offer.startDate) {
        if (!dateFilter.$gte || new Date(offer.startDate) >= dateFilter.$gte) {
          if (!dateFilter.$lte || new Date(offer.startDate) <= dateFilter.$lte) {
            events.push({
              id: `campaign-start-${offer._id}`,
              title: `Campaign Start - ${offer.offerName}`,
              type: 'campaign',
              subType: 'campaign_start',
              date: offer.startDate,
              status: offer.status,
              offerId: offer._id,
              description: `Campaign starts for: ${offer.offerName}`,
              participants: {
                marketer: offer.marketerId,
                creator: offer.creatorId,
                otherParty: otherParty
              },
              userRole: isMarketer ? 'marketer' : 'creator',
              priority: 'high',
              color: '#00D4AA',
              icon: '🚀'
            });
          }
        }
      }

      if (offer.endDate) {
        if (!dateFilter.$gte || new Date(offer.endDate) >= dateFilter.$gte) {
          if (!dateFilter.$lte || new Date(offer.endDate) <= dateFilter.$lte) {
            events.push({
              id: `campaign-end-${offer._id}`,
              title: `Campaign End - ${offer.offerName}`,
              type: 'campaign',
              subType: 'campaign_end',
              date: offer.endDate,
              status: offer.status,
              offerId: offer._id,
              description: `Campaign ends for: ${offer.offerName}`,
              participants: {
                marketer: offer.marketerId,
                creator: offer.creatorId,
                otherParty: otherParty
              },
              userRole: isMarketer ? 'marketer' : 'creator',
              priority: 'medium',
              color: '#FF3B30',
              icon: '🏁'
            });
          }
        }
      }

      // Trial conversion events
      if (offer.trialDetails && offer.trialDetails.isTrialOffer) {
        if (offer.trialDetails.autoConvertDate) {
          if (!dateFilter.$gte || new Date(offer.trialDetails.autoConvertDate) >= dateFilter.$gte) {
            if (!dateFilter.$lte || new Date(offer.trialDetails.autoConvertDate) <= dateFilter.$lte) {
              events.push({
                id: `trial-convert-${offer._id}`,
                title: `Trial Conversion - ${offer.offerName}`,
                type: 'trial',
                subType: 'trial_conversion',
                date: offer.trialDetails.autoConvertDate,
                status: offer.trialDetails.trialStatus,
                offerId: offer._id,
                description: `Trial converts to full payment for: ${offer.offerName}`,
                participants: {
                  marketer: offer.marketerId,
                  creator: offer.creatorId,
                  otherParty: otherParty
                },
                userRole: isMarketer ? 'marketer' : 'creator',
                priority: 'high',
                color: '#AF52DE',
                icon: '💳',
                metadata: {
                  trialAmount: offer.trialDetails.trialAmount,
                  fullAmount: offer.trialDetails.fullAmount
                }
              });
            }
          }
        }
      }
    }

    // Sort events by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter by event types if specified
    let filteredEvents = events;
    if (eventTypes && eventTypes.length > 0) {
      const typesArray = Array.isArray(eventTypes) ? eventTypes : eventTypes.split(',');
      filteredEvents = events.filter(event => typesArray.includes(event.type));
    }

    // Calculate summary statistics
    const summary = calculateCalendarSummary(filteredEvents, view);

    return successResponse(res, "Calendar events retrieved successfully", {
      events: filteredEvents,
      summary,
      totalEvents: filteredEvents.length,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      eventTypes: getAvailableEventTypes(filteredEvents),
      userRole: user.userType?.toLowerCase() || 'user'
    });

  } catch (error) {
    console.error("Error getting calendar events:", error);
    return handleServerError(res, error);
  }
};

// Get upcoming events (next 7 days)
exports.getUpcomingEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7); // Next 7 days

    // Use the main function with date filters
    req.query.startDate = startDate.toISOString();
    req.query.endDate = endDate.toISOString();
    
    const result = await new Promise((resolve, reject) => {
      const mockRes = {
        status: () => mockRes,
        json: (data) => resolve(data)
      };
      
      exports.getCalendarEvents(req, mockRes).catch(reject);
    });

    if (result.success) {
      const upcomingEvents = result.data.events
        .filter(event => new Date(event.date) >= new Date())
        .slice(0, parseInt(limit));

      return successResponse(res, "Upcoming events retrieved successfully", {
        events: upcomingEvents,
        totalUpcoming: upcomingEvents.length,
        nextWeekTotal: result.data.totalEvents
      });
    } else {
      throw new Error(result.message);
    }

  } catch (error) {
    console.error("Error getting upcoming events:", error);
    return handleServerError(res, error);
  }
};

// Get events for a specific date
exports.getEventsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    if (isNaN(targetDate.getTime())) {
      return errorResponse(res, "Invalid date format", 400);
    }

    // Set start and end of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    req.query.startDate = startOfDay.toISOString();
    req.query.endDate = endOfDay.toISOString();

    const result = await new Promise((resolve, reject) => {
      const mockRes = {
        status: () => mockRes,
        json: (data) => resolve(data)
      };
      
      exports.getCalendarEvents(req, mockRes).catch(reject);
    });

    if (result.success) {
      return successResponse(res, `Events for ${date} retrieved successfully`, {
        date: date,
        events: result.data.events,
        totalEventsForDate: result.data.events.length
      });
    } else {
      throw new Error(result.message);
    }

  } catch (error) {
    console.error("Error getting events by date:", error);
    return handleServerError(res, error);
  }
};

// Helper functions
const getPriorityByStatus = (status) => {
  const priorityMap = {
    'pending': 'low',
    'funded': 'medium',
    'in_progress': 'high',
    'submitted': 'high',
    'approved': 'medium',
    'completed': 'low',
    'cancelled': 'low'
  };
  return priorityMap[status] || 'medium';
};

const getColorByType = (type, status) => {
  const colorMap = {
    milestone: {
      pending: '#8E8E93',
      funded: '#007AFF',
      in_progress: '#FF9500',
      submitted: '#AF52DE',
      approved: '#34C759',
      completed: '#34C759',
      cancelled: '#FF3B30'
    },
    review: '#007AFF',
    post: '#34C759',
    campaign: '#00D4AA',
    trial: '#AF52DE',
    auto_release: '#FF9500'
  };
  
  if (type === 'milestone' && colorMap.milestone[status]) {
    return colorMap.milestone[status];
  }
  
  return colorMap[type] || '#430B92';
};

const getMilestoneIcon = (label) => {
  const iconMap = {
    'Initial Payment': '💰',
    'Progress Payment': '⚡',
    'Completion Payment': '🎯',
    'Final Payment': '🏆'
  };
  return iconMap[label] || '📋';
};

const getAvailableEventTypes = (events) => {
  const types = [...new Set(events.map(event => event.type))];
  return types.map(type => ({
    type,
    count: events.filter(event => event.type === type).length,
    label: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));
};

const calculateCalendarSummary = (events, view) => {
  const now = new Date();
  const summary = {
    totalEvents: events.length,
    upcomingEvents: events.filter(e => new Date(e.date) >= now).length,
    overdue: events.filter(e => new Date(e.date) < now && ['pending', 'in_progress'].includes(e.status)).length,
    thisWeek: 0,
    thisMonth: 0,
    byType: {},
    byPriority: {
      high: 0,
      medium: 0,
      low: 0
    }
  };

  // Calculate time-based summaries
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  events.forEach(event => {
    const eventDate = new Date(event.date);
    
    // This week
    if (eventDate >= startOfWeek && eventDate <= endOfWeek) {
      summary.thisWeek++;
    }
    
    // This month
    if (eventDate >= startOfMonth && eventDate <= endOfMonth) {
      summary.thisMonth++;
    }

    // By type
    summary.byType[event.type] = (summary.byType[event.type] || 0) + 1;

    // By priority
    if (event.priority && summary.byPriority[event.priority] !== undefined) {
      summary.byPriority[event.priority]++;
    }
  });

  return summary;
};

module.exports = exports;