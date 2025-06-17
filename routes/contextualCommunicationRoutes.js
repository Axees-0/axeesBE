const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  getContextualConversation,
  sendContextualMessage,
  getCommunicationAnalytics,
  markMessagesAsRead,
  getCommunicationSuggestions
} = require('../controllers/contextualCommunicationController');

/**
 * @swagger
 * tags:
 *   name: Contextual Communication
 *   description: Context-aware communication system for deals and offers
 */

/**
 * @swagger
 * /api/contextual-communication/conversation:
 *   get:
 *     summary: Get contextual conversation for a deal or offer
 *     tags: [Contextual Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dealId
 *         schema:
 *           type: string
 *         description: Deal ID to get conversation for
 *       - in: query
 *         name: offerId
 *         schema:
 *           type: string
 *         description: Offer ID to get conversation for
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include message history
 *       - in: query
 *         name: includeContext
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include contextual suggestions and quick replies
 *     responses:
 *       200:
 *         description: Contextual conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversation:
 *                       type: object
 *                       properties:
 *                         participants:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               userName:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                               role:
 *                                 type: string
 *                         context:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               enum: [deal, offer]
 *                             status:
 *                               type: string
 *                             phase:
 *                               type: string
 *                             userRole:
 *                               type: string
 *                               enum: [creator, marketer]
 *                             urgentItems:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             nextActions:
 *                               type: array
 *                               items:
 *                                 type: object
 *                         messages:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               author:
 *                                 type: string
 *                               content:
 *                                 type: string
 *                               messageType:
 *                                 type: string
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                               isUrgent:
 *                                 type: boolean
 *                               attachments:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                               readBy:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                         suggestedTopics:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               topic:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               priority:
 *                                 type: string
 *                         quickReplies:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               text:
 *                                 type: string
 *                               category:
 *                                 type: string
 *                     unreadCount:
 *                       type: number
 *                     lastActivity:
 *                       type: string
 *                       format: date-time
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         canSendMessage:
 *                           type: boolean
 *                         canViewHistory:
 *                           type: boolean
 *                         canUploadFiles:
 *                           type: boolean
 *       400:
 *         description: Either dealId or offerId is required
 *       403:
 *         description: Access denied - user is not a participant
 *       404:
 *         description: Deal or offer not found
 */
router.get('/conversation', authenticate, getContextualConversation);

/**
 * @swagger
 * /api/contextual-communication/send:
 *   post:
 *     summary: Send a contextual message
 *     tags: [Contextual Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               dealId:
 *                 type: string
 *                 description: Deal ID (required if offerId not provided)
 *               offerId:
 *                 type: string
 *                 description: Offer ID (required if dealId not provided)
 *               message:
 *                 type: string
 *                 description: Message content
 *                 minLength: 1
 *                 maxLength: 2000
 *               messageType:
 *                 type: string
 *                 enum: [text, image, document, voice, video]
 *                 default: text
 *                 description: Type of message being sent
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [image, document, video, audio]
 *                     url:
 *                       type: string
 *                     name:
 *                       type: string
 *                     size:
 *                       type: number
 *                     mimeType:
 *                       type: string
 *                 description: File attachments
 *               isUrgent:
 *                 type: boolean
 *                 default: false
 *                 description: Mark message as urgent
 *               context:
 *                 type: object
 *                 properties:
 *                   threadId:
 *                     type: string
 *                     description: Thread ID for threaded conversations
 *                   replyToId:
 *                     type: string
 *                     description: ID of message being replied to
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Message tags for categorization
 *                 description: Additional context information
 *               suggestedActions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     title:
 *                       type: string
 *                     action:
 *                       type: string
 *                 description: Suggested follow-up actions
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: object
 *                       description: Sent message details
 *                     messageId:
 *                       type: string
 *                       description: Unique message identifier
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Message sent timestamp
 *                     followUpSuggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: AI-generated follow-up suggestions
 *                     deliveryStatus:
 *                       type: string
 *                       enum: [sent, delivered, failed]
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 *       404:
 *         description: Deal or offer not found
 */
router.post('/send', authenticate, sendContextualMessage);

/**
 * @swagger
 * /api/contextual-communication/analytics:
 *   get:
 *     summary: Get communication analytics for a deal or offer
 *     tags: [Contextual Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dealId
 *         schema:
 *           type: string
 *         description: Deal ID to get analytics for
 *       - in: query
 *         name: offerId
 *         schema:
 *           type: string
 *         description: Offer ID to get analytics for
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Analytics timeframe
 *     responses:
 *       200:
 *         description: Communication analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         totalMessages:
 *                           type: number
 *                           description: Total messages in timeframe
 *                         messagesByUser:
 *                           type: object
 *                           description: Message count by user ID
 *                         messagesByDay:
 *                           type: object
 *                           description: Message count by day
 *                         averageResponseTime:
 *                           type: number
 *                           description: Average response time in hours
 *                         mostActiveHours:
 *                           type: object
 *                           description: Most active communication hours
 *                         attachmentsSent:
 *                           type: number
 *                           description: Number of attachments sent
 *                         urgentMessages:
 *                           type: number
 *                           description: Number of urgent messages
 *                     timeframe:
 *                       type: string
 *                       description: Analyzed timeframe
 *                     totalMessages:
 *                       type: number
 *                       description: Total messages ever
 *                     participants:
 *                       type: number
 *                       description: Number of participants
 *                     lastActivity:
 *                       type: string
 *                       format: date-time
 *                       description: Last message timestamp
 *       400:
 *         description: Either dealId or offerId is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Deal or offer not found
 */
router.get('/analytics', authenticate, getCommunicationAnalytics);

/**
 * @swagger
 * /api/contextual-communication/mark-read:
 *   post:
 *     summary: Mark messages as read
 *     tags: [Contextual Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dealId OR offerId
 *             properties:
 *               dealId:
 *                 type: string
 *                 description: Deal ID (required if offerId not provided)
 *               offerId:
 *                 type: string
 *                 description: Offer ID (required if dealId not provided)
 *               messageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific message IDs to mark as read
 *               markAllAsRead:
 *                 type: boolean
 *                 default: false
 *                 description: Mark all messages as read
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     markedCount:
 *                       type: number
 *                       description: Number of messages marked as read
 *                     totalMessages:
 *                       type: number
 *                       description: Total messages in conversation
 *                     unreadCount:
 *                       type: number
 *                       description: Remaining unread messages
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 *       404:
 *         description: Deal or offer not found
 */
router.post('/mark-read', authenticate, markMessagesAsRead);

/**
 * @swagger
 * /api/contextual-communication/suggestions:
 *   get:
 *     summary: Get AI-powered communication suggestions
 *     tags: [Contextual Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dealId
 *         schema:
 *           type: string
 *         description: Deal ID to get suggestions for
 *       - in: query
 *         name: offerId
 *         schema:
 *           type: string
 *         description: Offer ID to get suggestions for
 *       - in: query
 *         name: context
 *         schema:
 *           type: object
 *         description: Additional context for suggestions
 *     responses:
 *       200:
 *         description: Communication suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     quickReplies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                           category:
 *                             type: string
 *                       description: Quick reply suggestions
 *                     suggestedTopics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           topic:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           priority:
 *                             type: string
 *                       description: Conversation topic suggestions
 *                     templateMessages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           template:
 *                             type: string
 *                           variables:
 *                             type: array
 *                             items:
 *                               type: string
 *                       description: Message templates
 *                     smartActions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           action:
 *                             type: string
 *                           target:
 *                             type: string
 *                       description: Context-aware action suggestions
 *       400:
 *         description: Either dealId or offerId is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Deal or offer not found
 */
router.get('/suggestions', authenticate, getCommunicationSuggestions);

// Add missing endpoints for frontend integration
router.post('/suggestions', async (req, res) => {
  try {
    const { context, contextData } = req.body;
    
    // Generate contextual suggestions based on current context
    const suggestions = await generateContextualSuggestions(context, contextData);
    
    res.json({
      success: true,
      suggestions: suggestions || []
    });
  } catch (error) {
    console.error('Error generating contextual suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions'
    });
  }
});

router.get('/milestones/upcoming', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Get upcoming milestones for the user
    const Deal = require('../models/deal');
    const upcomingMilestones = await Deal.find({
      $or: [
        { creatorId: userId },
        { marketerId: userId }
      ],
      'milestones.deadline': {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      },
      status: { $in: ['active', 'in_progress'] }
    }).populate('milestones');

    const milestones = [];
    upcomingMilestones.forEach(deal => {
      deal.milestones.forEach(milestone => {
        const deadline = new Date(milestone.deadline);
        const now = new Date();
        if (deadline > now && deadline <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
          milestones.push({
            _id: milestone._id,
            title: milestone.title,
            deadline: milestone.deadline,
            dealId: deal._id,
            dealTitle: deal.title
          });
        }
      });
    });

    res.json({
      success: true,
      data: milestones
    });
  } catch (error) {
    console.error('Error fetching upcoming milestones:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming milestones'
    });
  }
});

router.get('/payments/upcoming', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Get upcoming payments for the user
    const Deal = require('../models/deal');
    const upcomingPayments = await Deal.find({
      $or: [
        { creatorId: userId },
        { marketerId: userId }
      ],
      'milestones.paymentScheduled': {
        $gte: new Date(),
        $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Next 3 days
      },
      status: { $in: ['active', 'in_progress'] }
    });

    const payments = [];
    upcomingPayments.forEach(deal => {
      deal.milestones.forEach(milestone => {
        if (milestone.paymentScheduled) {
          const paymentDate = new Date(milestone.paymentScheduled);
          const now = new Date();
          if (paymentDate > now && paymentDate <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) {
            payments.push({
              _id: milestone._id,
              amount: milestone.payment,
              scheduledDate: milestone.paymentScheduled,
              dealId: deal._id,
              dealTitle: deal.title
            });
          }
        }
      });
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching upcoming payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming payments'
    });
  }
});

// Helper function for generating contextual suggestions
async function generateContextualSuggestions(context, contextData) {
  const suggestions = [];
  
  switch (context) {
    case 'offer':
      suggestions.push({
        type: 'tip',
        title: 'Optimize Your Offer',
        message: 'Add more details about deliverables to increase acceptance rate',
        action: 'Edit Offer'
      });
      break;
      
    case 'deal':
      suggestions.push({
        type: 'reminder',
        title: 'Update Progress',
        message: 'Keep your client updated on milestone progress',
        action: 'Send Update'
      });
      break;
      
    case 'dashboard':
      suggestions.push({
        type: 'insight',
        title: 'Performance Tip',
        message: 'Your response rate is below average. Try responding within 2 hours',
        action: 'View Stats'
      });
      break;
      
    case 'marketplace':
      suggestions.push({
        type: 'tip',
        title: 'Search Tip',
        message: 'Use filters to find deals that match your skills',
        action: 'Show Filters'
      });
      break;
      
    case 'profile':
      suggestions.push({
        type: 'reminder',
        title: 'Complete Your Profile',
        message: 'Add portfolio samples to increase visibility by 40%',
        action: 'Add Portfolio'
      });
      break;
      
    default:
      suggestions.push({
        type: 'general',
        title: 'Welcome',
        message: 'Everything looks good! Keep up the great work.',
        action: null
      });
  }
  
  return suggestions;
}

module.exports = router;