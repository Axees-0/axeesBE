const Deal = require('../models/deal');
const Offer = require('../models/offer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');

/**
 * Contextual Communication Controller
 * Provides intelligent communication features with context awareness,
 * conversation threading, and smart suggestions for deal-related discussions
 */

// Get contextual conversation for a deal/offer
exports.getContextualConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dealId, offerId, includeHistory = true, includeContext = true } = req.query;

    if (!dealId && !offerId) {
      return errorResponse(res, "Either dealId or offerId is required", 400);
    }

    let conversation = {
      participants: [],
      context: {},
      messages: [],
      suggestedTopics: [],
      quickReplies: [],
      attachments: []
    };

    // Get deal or offer information
    let deal, offer;
    if (dealId) {
      deal = await Deal.findById(dealId)
        .populate('creatorId', 'userName email profileImage role')
        .populate('marketerId', 'userName email profileImage role')
        .populate('messages.author', 'userName profileImage');
      
      if (!deal) {
        return errorResponse(res, "Deal not found", 404);
      }

      // Verify user is participant
      if (deal.creatorId._id.toString() !== userId && deal.marketerId._id.toString() !== userId) {
        return errorResponse(res, "Access denied - you are not a participant in this deal", 403);
      }

      conversation.participants = [deal.creatorId, deal.marketerId];
      conversation.context = await buildDealContext(deal, userId);
      
      if (includeHistory) {
        conversation.messages = deal.messages || [];
      }
    }

    if (offerId) {
      offer = await Offer.findById(offerId)
        .populate('creatorId', 'userName email profileImage role')
        .populate('marketerId', 'userName email profileImage role')
        .populate('messages.author', 'userName profileImage');
      
      if (!offer) {
        return errorResponse(res, "Offer not found", 404);
      }

      // Verify user is participant
      if (offer.creatorId._id.toString() !== userId && offer.marketerId._id.toString() !== userId) {
        return errorResponse(res, "Access denied - you are not a participant in this offer", 403);
      }

      conversation.participants = [offer.creatorId, offer.marketerId];
      conversation.context = await buildOfferContext(offer, userId);
      
      if (includeHistory) {
        conversation.messages = offer.messages || [];
      }
    }

    // Generate contextual suggestions
    if (includeContext) {
      conversation.suggestedTopics = await generateSuggestedTopics(deal || offer, userId);
      conversation.quickReplies = await generateQuickReplies(deal || offer, userId);
    }

    // Get related attachments and documents
    conversation.attachments = await getRelatedAttachments(deal || offer);

    return successResponse(res, "Contextual conversation retrieved successfully", {
      conversation,
      unreadCount: getUnreadMessageCount(conversation.messages, userId),
      lastActivity: getLastActivityTime(conversation.messages),
      permissions: getUserPermissions(deal || offer, userId)
    });

  } catch (error) {
    console.error("Error getting contextual conversation:", error);
    return handleServerError(res, error);
  }
};

// Send contextual message
exports.sendContextualMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      dealId,
      offerId,
      message,
      messageType = 'text',
      attachments = [],
      isUrgent = false,
      context = {},
      suggestedActions = []
    } = req.body;

    if (!dealId && !offerId) {
      return errorResponse(res, "Either dealId or offerId is required", 400);
    }

    if (!message || message.trim().length === 0) {
      return errorResponse(res, "Message content is required", 400);
    }

    const user = await User.findById(userId).select('userName profileImage role');
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const messageData = {
      author: userId,
      content: message.trim(),
      messageType,
      timestamp: new Date(),
      isUrgent,
      context: {
        ...context,
        deviceInfo: req.headers['user-agent'],
        ipAddress: req.ip
      },
      attachments: attachments.map(att => ({
        type: att.type,
        url: att.url,
        name: att.name,
        size: att.size,
        mimeType: att.mimeType
      })),
      suggestedActions,
      readBy: [{ user: userId, readAt: new Date() }],
      reactions: [],
      metadata: {
        messageId: generateMessageId(),
        threadId: context.threadId || null,
        replyToId: context.replyToId || null
      }
    };

    let updatedDoc;
    let recipientId;

    if (dealId) {
      const deal = await Deal.findById(dealId).populate('creatorId marketerId');
      if (!deal) {
        return errorResponse(res, "Deal not found", 404);
      }

      // Verify user is participant
      if (deal.creatorId._id.toString() !== userId && deal.marketerId._id.toString() !== userId) {
        return errorResponse(res, "Access denied", 403);
      }

      recipientId = deal.creatorId._id.toString() === userId ? deal.marketerId._id : deal.creatorId._id;

      // Add contextual information based on deal status
      messageData.context.dealStatus = deal.status;
      messageData.context.dealPhase = getCurrentDealPhase(deal);
      
      if (!deal.messages) {
        deal.messages = [];
      }
      deal.messages.push(messageData);
      deal.lastMessageAt = new Date();
      
      updatedDoc = await deal.save();
    }

    if (offerId) {
      const offer = await Offer.findById(offerId).populate('creatorId marketerId');
      if (!offer) {
        return errorResponse(res, "Offer not found", 404);
      }

      // Verify user is participant
      if (offer.creatorId._id.toString() !== userId && offer.marketerId._id.toString() !== userId) {
        return errorResponse(res, "Access denied", 403);
      }

      recipientId = offer.creatorId._id.toString() === userId ? offer.marketerId._id : offer.creatorId._id;

      // Add contextual information based on offer status
      messageData.context.offerStatus = offer.status;
      messageData.context.negotiationPhase = getCurrentNegotiationPhase(offer);
      
      if (!offer.messages) {
        offer.messages = [];
      }
      offer.messages.push(messageData);
      offer.lastMessageAt = new Date();
      
      updatedDoc = await offer.save();
    }

    // Send real-time notification to recipient
    await sendMessageNotification(recipientId, messageData, dealId || offerId, messageType);

    // Generate smart follow-up suggestions
    const followUpSuggestions = await generateFollowUpSuggestions(messageData, updatedDoc);

    return successResponse(res, "Contextual message sent successfully", {
      message: messageData,
      messageId: messageData.metadata.messageId,
      timestamp: messageData.timestamp,
      followUpSuggestions,
      deliveryStatus: 'sent'
    });

  } catch (error) {
    console.error("Error sending contextual message:", error);
    return handleServerError(res, error);
  }
};

// Get communication analytics for a deal/offer
exports.getCommunicationAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dealId, offerId, timeframe = '30d' } = req.query;

    if (!dealId && !offerId) {
      return errorResponse(res, "Either dealId or offerId is required", 400);
    }

    let doc;
    if (dealId) {
      doc = await Deal.findById(dealId);
    } else {
      doc = await Offer.findById(offerId);
    }

    if (!doc) {
      return errorResponse(res, "Document not found", 404);
    }

    // Verify user access
    if (doc.creatorId.toString() !== userId && doc.marketerId.toString() !== userId) {
      return errorResponse(res, "Access denied", 403);
    }

    const messages = doc.messages || [];
    const analytics = await calculateCommunicationAnalytics(messages, userId, timeframe);

    return successResponse(res, "Communication analytics retrieved successfully", {
      analytics,
      timeframe,
      totalMessages: messages.length,
      participants: 2,
      lastActivity: doc.lastMessageAt || doc.createdAt
    });

  } catch (error) {
    console.error("Error getting communication analytics:", error);
    return handleServerError(res, error);
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dealId, offerId, messageIds, markAllAsRead = false } = req.body;

    if (!dealId && !offerId) {
      return errorResponse(res, "Either dealId or offerId is required", 400);
    }

    let doc;
    if (dealId) {
      doc = await Deal.findById(dealId);
    } else {
      doc = await Offer.findById(offerId);
    }

    if (!doc) {
      return errorResponse(res, "Document not found", 404);
    }

    // Verify user access
    if (doc.creatorId.toString() !== userId && doc.marketerId.toString() !== userId) {
      return errorResponse(res, "Access denied", 403);
    }

    let markedCount = 0;
    const messages = doc.messages || [];

    messages.forEach(message => {
      if (markAllAsRead || (messageIds && messageIds.includes(message.metadata?.messageId))) {
        const existingRead = message.readBy.find(r => r.user.toString() === userId);
        if (!existingRead) {
          message.readBy.push({ user: userId, readAt: new Date() });
          markedCount++;
        }
      }
    });

    await doc.save();

    return successResponse(res, "Messages marked as read successfully", {
      markedCount,
      totalMessages: messages.length,
      unreadCount: getUnreadMessageCount(messages, userId)
    });

  } catch (error) {
    console.error("Error marking messages as read:", error);
    return handleServerError(res, error);
  }
};

// Get communication suggestions
exports.getCommunicationSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dealId, offerId, context = {} } = req.query;

    if (!dealId && !offerId) {
      return errorResponse(res, "Either dealId or offerId is required", 400);
    }

    let doc;
    if (dealId) {
      doc = await Deal.findById(dealId).populate('creatorId marketerId');
    } else {
      doc = await Offer.findById(offerId).populate('creatorId marketerId');
    }

    if (!doc) {
      return errorResponse(res, "Document not found", 404);
    }

    // Verify user access
    if (doc.creatorId._id.toString() !== userId && doc.marketerId._id.toString() !== userId) {
      return errorResponse(res, "Access denied", 403);
    }

    const suggestions = {
      quickReplies: await generateQuickReplies(doc, userId),
      suggestedTopics: await generateSuggestedTopics(doc, userId),
      templateMessages: await getTemplateMessages(doc, userId),
      smartActions: await generateSmartActions(doc, userId, context)
    };

    return successResponse(res, "Communication suggestions retrieved successfully", suggestions);

  } catch (error) {
    console.error("Error getting communication suggestions:", error);
    return handleServerError(res, error);
  }
};

// Helper functions
const buildDealContext = async (deal, userId) => {
  return {
    type: 'deal',
    dealId: deal._id,
    dealName: deal.dealName,
    dealNumber: deal.dealNumber,
    status: deal.status,
    phase: getCurrentDealPhase(deal),
    userRole: deal.creatorId._id.toString() === userId ? 'creator' : 'marketer',
    milestones: deal.milestones?.map(m => ({
      id: m._id,
      name: m.name,
      status: m.status,
      dueDate: m.dueDate,
      isOverdue: new Date() > new Date(m.dueDate) && m.status !== 'completed'
    })),
    paymentInfo: {
      amount: deal.paymentInfo?.paymentAmount,
      status: deal.paymentInfo?.status,
      isPaid: deal.paymentInfo?.isPaid
    },
    timeline: {
      createdAt: deal.createdAt,
      acceptedAt: deal.acceptedAt,
      startedAt: deal.startedAt,
      completedAt: deal.completedAt,
      estimatedCompletion: deal.estimatedCompletionDate
    },
    urgentItems: await getUrgentItems(deal),
    nextActions: await getNextActions(deal, userId)
  };
};

const buildOfferContext = async (offer, userId) => {
  return {
    type: 'offer',
    offerId: offer._id,
    offerName: offer.campaignDetails?.campaignName || 'Offer',
    status: offer.status,
    phase: getCurrentNegotiationPhase(offer),
    userRole: offer.creatorId._id.toString() === userId ? 'creator' : 'marketer',
    negotiationHistory: offer.negotiationHistory?.slice(-3) || [],
    paymentTerms: {
      amount: offer.paymentTerms?.amount,
      type: offer.paymentTerms?.type,
      milestones: offer.paymentTerms?.milestones?.length || 0
    },
    deadline: offer.responseDeadline,
    isExpired: offer.responseDeadline && new Date() > new Date(offer.responseDeadline),
    platforms: offer.socialMediaDetails?.platforms || [],
    deliverables: offer.deliverables?.map(d => ({
      type: d.type,
      description: d.description,
      timeline: d.timeline
    })) || []
  };
};

const getCurrentDealPhase = (deal) => {
  if (deal.status === 'completed') return 'completed';
  if (deal.status === 'cancelled') return 'cancelled';
  if (deal.status === 'disputed') return 'disputed';
  if (deal.completedAt) return 'finalizing';
  if (deal.startedAt) return 'execution';
  if (deal.acceptedAt && deal.paymentInfo?.isPaid) return 'pre_production';
  if (deal.acceptedAt) return 'payment_pending';
  return 'negotiation';
};

const getCurrentNegotiationPhase = (offer) => {
  if (offer.status === 'accepted') return 'accepted';
  if (offer.status === 'rejected') return 'rejected';
  if (offer.status === 'expired') return 'expired';
  if (offer.negotiationHistory?.length > 0) return 'negotiating';
  return 'initial_review';
};

const generateSuggestedTopics = async (doc, userId) => {
  const suggestions = [];
  const userRole = doc.creatorId._id?.toString() === userId ? 'creator' : 'marketer';
  
  if (doc.status === 'active' || doc.status === 'pending') {
    // Deal-specific suggestions
    if (doc.milestones?.some(m => m.status === 'pending')) {
      suggestions.push({
        topic: 'milestone_discussion',
        title: 'Milestone Planning',
        description: 'Discuss upcoming milestone deliverables and timelines',
        priority: 'medium',
        context: { type: 'milestone' }
      });
    }

    if (doc.deliverables?.some(d => !d.submittedAt)) {
      suggestions.push({
        topic: 'content_requirements',
        title: 'Content Requirements',
        description: 'Clarify content specifications and guidelines',
        priority: 'high',
        context: { type: 'content' }
      });
    }

    if (userRole === 'marketer' && !doc.paymentInfo?.isPaid) {
      suggestions.push({
        topic: 'payment_processing',
        title: 'Payment Processing',
        description: 'Complete payment to start the collaboration',
        priority: 'high',
        context: { type: 'payment' }
      });
    }
  }

  // Offer-specific suggestions
  if (doc.campaignDetails && doc.status === 'pending') {
    suggestions.push({
      topic: 'campaign_details',
      title: 'Campaign Details',
      description: 'Discuss campaign objectives and creative direction',
      priority: 'medium',
      context: { type: 'campaign' }
    });

    if (doc.negotiationHistory?.length > 0) {
      suggestions.push({
        topic: 'terms_negotiation',
        title: 'Terms & Pricing',
        description: 'Continue discussing terms and pricing',
        priority: 'high',
        context: { type: 'negotiation' }
      });
    }
  }

  return suggestions.slice(0, 5); // Limit to top 5 suggestions
};

const generateQuickReplies = async (doc, userId) => {
  const replies = [];
  const userRole = doc.creatorId._id?.toString() === userId ? 'creator' : 'marketer';
  
  // Common quick replies
  replies.push(
    { text: "Thanks for the update!", category: 'acknowledgment' },
    { text: "Let me review and get back to you", category: 'acknowledgment' },
    { text: "Looks good to me", category: 'approval' },
    { text: "I have some questions about this", category: 'clarification' }
  );

  // Context-specific replies
  if (doc.status === 'pending' && userRole === 'creator') {
    replies.push(
      { text: "I accept this offer", category: 'decision' },
      { text: "I'd like to negotiate the terms", category: 'decision' },
      { text: "I need more details before deciding", category: 'clarification' }
    );
  }

  if (doc.status === 'active') {
    replies.push(
      { text: "I'll have this ready by the deadline", category: 'commitment' },
      { text: "I may need an extension", category: 'timeline' },
      { text: "Content is ready for review", category: 'submission' }
    );
  }

  return replies.slice(0, 8); // Limit to 8 quick replies
};

const generateSmartActions = async (doc, userId, context) => {
  const actions = [];
  const userRole = doc.creatorId._id?.toString() === userId ? 'creator' : 'marketer';

  // Deal-specific actions
  if (doc.dealId || doc.dealName) {
    if (userRole === 'creator' && doc.deliverables?.some(d => !d.submittedAt)) {
      actions.push({
        type: 'submit_content',
        title: 'Submit Content',
        description: 'Upload and submit your content for review',
        action: 'navigate',
        target: '/deals/' + doc._id + '/submit'
      });
    }

    if (userRole === 'marketer' && doc.paymentInfo && !doc.paymentInfo.isPaid) {
      actions.push({
        type: 'make_payment',
        title: 'Complete Payment',
        description: 'Process payment to start the collaboration',
        action: 'navigate',
        target: '/deals/' + doc._id + '/payment'
      });
    }
  }

  // Offer-specific actions
  if (doc.campaignDetails && doc.status === 'pending') {
    if (userRole === 'creator') {
      actions.push(
        {
          type: 'accept_offer',
          title: 'Accept Offer',
          description: 'Accept this collaboration offer',
          action: 'api_call',
          target: '/api/offers/' + doc._id + '/accept'
        },
        {
          type: 'negotiate_offer',
          title: 'Make Counter Offer',
          description: 'Propose alternative terms',
          action: 'navigate',
          target: '/offers/' + doc._id + '/negotiate'
        }
      );
    }
  }

  return actions;
};

const getTemplateMessages = async (doc, userId) => {
  const templates = [];
  const userRole = doc.creatorId._id?.toString() === userId ? 'creator' : 'marketer';

  // Role-specific templates
  if (userRole === 'creator') {
    templates.push(
      {
        id: 'content_ready',
        title: 'Content Ready for Review',
        template: 'Hi! I\'ve completed the content for {{milestone_name}}. It\'s ready for your review. Please let me know if you need any adjustments.',
        variables: ['milestone_name']
      },
      {
        id: 'timeline_update',
        title: 'Timeline Update',
        template: 'Quick update on the timeline: I\'m on track to deliver {{deliverable_type}} by {{due_date}}. Everything is progressing well!',
        variables: ['deliverable_type', 'due_date']
      }
    );
  } else {
    templates.push(
      {
        id: 'approval_feedback',
        title: 'Content Approval',
        template: 'Great work on the {{content_type}}! I\'ve approved it and you can proceed with posting. The content aligns perfectly with our brand guidelines.',
        variables: ['content_type']
      },
      {
        id: 'revision_request',
        title: 'Revision Request',
        template: 'Thanks for the submission! I have a few minor revisions: {{revision_details}}. Once these are updated, we\'ll be good to go.',
        variables: ['revision_details']
      }
    );
  }

  return templates;
};

const generateMessageId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getUnreadMessageCount = (messages, userId) => {
  return messages.filter(msg => 
    msg.author.toString() !== userId && 
    !msg.readBy.some(r => r.user.toString() === userId)
  ).length;
};

const getLastActivityTime = (messages) => {
  if (!messages || messages.length === 0) return null;
  return messages[messages.length - 1].timestamp;
};

const getUserPermissions = (doc, userId) => {
  const isParticipant = doc.creatorId._id?.toString() === userId || doc.marketerId._id?.toString() === userId;
  
  return {
    canSendMessage: isParticipant,
    canViewHistory: isParticipant,
    canUploadFiles: isParticipant,
    canMarkAsRead: isParticipant,
    canReactToMessages: isParticipant
  };
};

const sendMessageNotification = async (recipientId, messageData, contextId, messageType) => {
  try {
    await Notification.create({
      user: recipientId,
      type: 'new_message',
      title: 'New Message',
      subtitle: messageData.content.length > 50 ? 
        messageData.content.substring(0, 50) + '...' : 
        messageData.content,
      data: {
        contextId,
        messageId: messageData.metadata.messageId,
        messageType,
        isUrgent: messageData.isUrgent
      },
      unread: true
    });
  } catch (error) {
    console.error('Error sending message notification:', error);
  }
};

const calculateCommunicationAnalytics = async (messages, userId, timeframe) => {
  const now = new Date();
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  
  const filteredMessages = messages.filter(msg => new Date(msg.timestamp) >= startDate);
  
  const analytics = {
    totalMessages: filteredMessages.length,
    messagesByUser: {},
    messagesByDay: {},
    averageResponseTime: 0,
    mostActiveHours: {},
    topicsDiscussed: [],
    attachmentsSent: 0,
    urgentMessages: 0
  };

  filteredMessages.forEach(msg => {
    const authorId = msg.author.toString();
    const day = new Date(msg.timestamp).toISOString().split('T')[0];
    const hour = new Date(msg.timestamp).getHours();

    // Messages by user
    analytics.messagesByUser[authorId] = (analytics.messagesByUser[authorId] || 0) + 1;

    // Messages by day
    analytics.messagesByDay[day] = (analytics.messagesByDay[day] || 0) + 1;

    // Active hours
    analytics.mostActiveHours[hour] = (analytics.mostActiveHours[hour] || 0) + 1;

    // Attachments and urgent messages
    if (msg.attachments?.length > 0) {
      analytics.attachmentsSent += msg.attachments.length;
    }
    if (msg.isUrgent) {
      analytics.urgentMessages++;
    }
  });

  return analytics;
};

const getUrgentItems = async (deal) => {
  const urgentItems = [];
  const now = new Date();

  // Overdue milestones
  if (deal.milestones) {
    deal.milestones.forEach(milestone => {
      if (milestone.dueDate && new Date(milestone.dueDate) < now && milestone.status !== 'completed') {
        urgentItems.push({
          type: 'overdue_milestone',
          title: `Milestone "${milestone.name}" is overdue`,
          priority: 'high',
          dueDate: milestone.dueDate
        });
      }
    });
  }

  // Payment pending
  if (!deal.paymentInfo?.isPaid && deal.status === 'accepted') {
    urgentItems.push({
      type: 'payment_required',
      title: 'Payment required to start collaboration',
      priority: 'high'
    });
  }

  return urgentItems;
};

const getNextActions = async (deal, userId) => {
  const actions = [];
  const userRole = deal.creatorId._id?.toString() === userId ? 'creator' : 'marketer';

  if (userRole === 'creator') {
    // Creator actions
    if (deal.deliverables?.some(d => d.status === 'pending')) {
      actions.push({
        type: 'submit_deliverable',
        title: 'Submit pending deliverables',
        priority: 'high'
      });
    }
  } else {
    // Marketer actions
    if (!deal.paymentInfo?.isPaid) {
      actions.push({
        type: 'complete_payment',
        title: 'Complete payment to start collaboration',
        priority: 'high'
      });
    }

    if (deal.deliverables?.some(d => d.status === 'submitted')) {
      actions.push({
        type: 'review_content',
        title: 'Review submitted content',
        priority: 'high'
      });
    }
  }

  return actions;
};

const generateFollowUpSuggestions = async (message, doc) => {
  const suggestions = [];

  // Based on message content, suggest follow-up actions
  const content = message.content.toLowerCase();

  if (content.includes('deadline') || content.includes('timeline')) {
    suggestions.push({
      type: 'schedule_reminder',
      title: 'Set a reminder for this deadline',
      action: 'create_reminder'
    });
  }

  if (content.includes('payment') || content.includes('invoice')) {
    suggestions.push({
      type: 'payment_action',
      title: 'Process payment or send invoice',
      action: 'payment_flow'
    });
  }

  if (content.includes('review') || content.includes('feedback')) {
    suggestions.push({
      type: 'review_action',
      title: 'Upload content for review',
      action: 'content_upload'
    });
  }

  return suggestions.slice(0, 3);
};

module.exports = exports;