const Deal = require('../models/deal');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');
const nodemailer = require('nodemailer');

/**
 * Comprehensive Offer Status Notification Controller
 * Handles intelligent notifications for all offer and deal status changes
 * with customizable preferences and smart delivery optimization
 */

// Configure email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Notification types and their configurations
const NOTIFICATION_TYPES = {
  OFFER_CREATED: {
    title: 'New Offer Received',
    priority: 'high',
    channels: ['push', 'email', 'in_app'],
    template: 'offer_created',
    immediate: true
  },
  OFFER_ACCEPTED: {
    title: 'Offer Accepted',
    priority: 'high',
    channels: ['push', 'email', 'in_app'],
    template: 'offer_accepted',
    immediate: true
  },
  OFFER_REJECTED: {
    title: 'Offer Rejected',
    priority: 'medium',
    channels: ['push', 'email', 'in_app'],
    template: 'offer_rejected',
    immediate: true
  },
  OFFER_NEGOTIATION: {
    title: 'Offer Negotiation Update',
    priority: 'medium',
    channels: ['push', 'in_app'],
    template: 'offer_negotiation',
    immediate: true
  },
  DEAL_PAYMENT_REQUIRED: {
    title: 'Payment Required',
    priority: 'high',
    channels: ['push', 'email', 'in_app'],
    template: 'payment_required',
    immediate: true
  },
  DEAL_IN_PROGRESS: {
    title: 'Deal Started',
    priority: 'medium',
    channels: ['push', 'in_app'],
    template: 'deal_started',
    immediate: false
  },
  MILESTONE_DUE: {
    title: 'Milestone Due Soon',
    priority: 'medium',
    channels: ['push', 'email'],
    template: 'milestone_due',
    immediate: false
  },
  CONTENT_SUBMITTED: {
    title: 'Content Submitted for Review',
    priority: 'high',
    channels: ['push', 'email', 'in_app'],
    template: 'content_submitted',
    immediate: true
  },
  CONTENT_APPROVED: {
    title: 'Content Approved',
    priority: 'high',
    channels: ['push', 'email', 'in_app'],
    template: 'content_approved',
    immediate: true
  },
  CONTENT_REVISION_REQUIRED: {
    title: 'Content Revision Required',
    priority: 'high',
    channels: ['push', 'email', 'in_app'],
    template: 'content_revision',
    immediate: true
  },
  DEAL_COMPLETED: {
    title: 'Deal Completed',
    priority: 'high',
    channels: ['push', 'email', 'in_app'],
    template: 'deal_completed',
    immediate: true
  },
  PAYMENT_RELEASED: {
    title: 'Payment Released',
    priority: 'high',
    channels: ['push', 'email', 'in_app'],
    template: 'payment_released',
    immediate: true
  }
};

// Email templates
const emailTemplate = (content, subject) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f7f7f7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      width: 150px;
      margin-bottom: 20px;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      color: white;
      font-weight: bold;
      margin: 10px 0;
    }
    .status-high { background-color: #dc3545; }
    .status-medium { background-color: #fd7e14; }
    .status-low { background-color: #198754; }
    .content {
      line-height: 1.6;
      color: #333;
    }
    .button {
      background-color: #430B92;
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      display: inline-block;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888888;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    .details-box {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
      border-left: 4px solid #430B92;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img class="logo" src="${process.env.BACKEND_URL}/uploads/assets/icon.png" alt="Axees Logo" />
    </div>
    ${content}
    <div class="footer">
      <p>Thank you,<br/>The Axees Team</p>
      <p>You can manage your notification preferences in your account settings.</p>
    </div>
  </div>
</body>
</html>
`;

// Get notification templates
const getNotificationTemplate = (type, data) => {
  const templates = {
    offer_created: {
      subject: `New ${data.offerType || 'Collaboration'} Offer from ${data.marketerName}`,
      content: `
        <div class="content">
          <h2>🎯 New Offer Received!</h2>
          <p>Hi ${data.creatorName},</p>
          <p>You've received a new collaboration offer from <strong>${data.marketerName}</strong>!</p>
          
          <div class="details-box">
            <h3>Offer Details:</h3>
            <ul>
              <li><strong>Campaign:</strong> ${data.offerName}</li>
              <li><strong>Payment:</strong> $${data.paymentAmount}</li>
              <li><strong>Platforms:</strong> ${data.platforms?.join(', ') || 'Not specified'}</li>
              <li><strong>Timeline:</strong> ${data.timeline || 'To be discussed'}</li>
            </ul>
          </div>
          
          <p>Review the offer details and respond at your convenience.</p>
          <a class="button" href="${process.env.FRONTEND_URL}/offers/${data.offerId}">View Offer Details</a>
        </div>
      `
    },
    
    offer_accepted: {
      subject: `Offer Accepted - ${data.offerName}`,
      content: `
        <div class="content">
          <h2>✅ Great News! Your Offer Was Accepted</h2>
          <p>Hi ${data.marketerName},</p>
          <p><strong>${data.creatorName}</strong> has accepted your collaboration offer!</p>
          
          <div class="details-box">
            <h3>Next Steps:</h3>
            <ul>
              <li>Complete the payment process to secure the deal</li>
              <li>Review final deliverables and timeline</li>
              <li>Begin collaboration with ${data.creatorName}</li>
            </ul>
          </div>
          
          <span class="status-badge status-high">ACTION REQUIRED</span>
          <p>Please complete the payment within 24 hours to confirm this deal.</p>
          <a class="button" href="${process.env.FRONTEND_URL}/deals/${data.dealId}/payment">Complete Payment</a>
        </div>
      `
    },
    
    offer_rejected: {
      subject: `Offer Update - ${data.offerName}`,
      content: `
        <div class="content">
          <h2>📋 Offer Status Update</h2>
          <p>Hi ${data.marketerName},</p>
          <p>Thank you for your interest in collaborating with <strong>${data.creatorName}</strong>.</p>
          <p>After careful consideration, they've decided not to move forward with this particular offer.</p>
          
          ${data.rejectionReason ? `
          <div class="details-box">
            <h3>Creator's Message:</h3>
            <p>"${data.rejectionReason}"</p>
          </div>
          ` : ''}
          
          <p>Don't worry! There are many other talented creators on Axees who would love to work with you.</p>
          <a class="button" href="${process.env.FRONTEND_URL}/creators">Explore More Creators</a>
        </div>
      `
    },
    
    payment_required: {
      subject: `Payment Required - ${data.dealName}`,
      content: `
        <div class="content">
          <h2>💳 Payment Required to Start Collaboration</h2>
          <p>Hi ${data.marketerName},</p>
          <p>Your deal with <strong>${data.creatorName}</strong> is ready to begin!</p>
          
          <div class="details-box">
            <h3>Payment Details:</h3>
            <ul>
              <li><strong>Amount:</strong> $${data.amount}</li>
              <li><strong>Deal:</strong> ${data.dealName}</li>
              <li><strong>Due Date:</strong> ${data.dueDate}</li>
            </ul>
          </div>
          
          <span class="status-badge status-high">URGENT</span>
          <p>Complete payment to secure your collaboration and begin the project.</p>
          <a class="button" href="${process.env.FRONTEND_URL}/deals/${data.dealId}/payment">Pay Now</a>
        </div>
      `
    },
    
    content_submitted: {
      subject: `Content Ready for Review - ${data.dealName}`,
      content: `
        <div class="content">
          <h2>📝 Content Submitted for Your Review</h2>
          <p>Hi ${data.marketerName},</p>
          <p><strong>${data.creatorName}</strong> has submitted content for your review!</p>
          
          <div class="details-box">
            <h3>Submission Details:</h3>
            <ul>
              <li><strong>Deal:</strong> ${data.dealName}</li>
              <li><strong>Content Type:</strong> ${data.contentType}</li>
              <li><strong>Submitted:</strong> ${data.submittedAt}</li>
              ${data.milestoneTitle ? `<li><strong>Milestone:</strong> ${data.milestoneTitle}</li>` : ''}
            </ul>
          </div>
          
          <span class="status-badge status-high">REVIEW NEEDED</span>
          <p>Please review and approve the content to proceed with the next phase.</p>
          <a class="button" href="${process.env.FRONTEND_URL}/deals/${data.dealId}/review">Review Content</a>
        </div>
      `
    },
    
    content_approved: {
      subject: `Content Approved - ${data.dealName}`,
      content: `
        <div class="content">
          <h2>🎉 Your Content Has Been Approved!</h2>
          <p>Hi ${data.creatorName},</p>
          <p>Great news! <strong>${data.marketerName}</strong> has approved your submitted content.</p>
          
          <div class="details-box">
            <h3>What's Next:</h3>
            <ul>
              <li>Content is ready for publishing</li>
              <li>Follow the agreed posting schedule</li>
              <li>Payment will be released according to the milestone plan</li>
            </ul>
          </div>
          
          <span class="status-badge status-low">APPROVED</span>
          <p>Excellent work! You're one step closer to completing this collaboration.</p>
          <a class="button" href="${process.env.FRONTEND_URL}/deals/${data.dealId}">View Deal Progress</a>
        </div>
      `
    },
    
    milestone_due: {
      subject: `Milestone Due Soon - ${data.dealName}`,
      content: `
        <div class="content">
          <h2>⏰ Milestone Deadline Approaching</h2>
          <p>Hi ${data.recipientName},</p>
          <p>This is a friendly reminder that a milestone deadline is approaching for your collaboration.</p>
          
          <div class="details-box">
            <h3>Milestone Details:</h3>
            <ul>
              <li><strong>Milestone:</strong> ${data.milestoneTitle}</li>
              <li><strong>Due Date:</strong> ${data.dueDate}</li>
              <li><strong>Days Remaining:</strong> ${data.daysRemaining}</li>
              <li><strong>Status:</strong> ${data.status}</li>
            </ul>
          </div>
          
          <span class="status-badge status-medium">DUE SOON</span>
          <p>Please ensure you complete the required deliverables on time.</p>
          <a class="button" href="${process.env.FRONTEND_URL}/deals/${data.dealId}">View Milestone</a>
        </div>
      `
    },
    
    deal_completed: {
      subject: `Deal Completed Successfully - ${data.dealName}`,
      content: `
        <div class="content">
          <h2>🏆 Collaboration Successfully Completed!</h2>
          <p>Hi ${data.recipientName},</p>
          <p>Congratulations! Your collaboration <strong>"${data.dealName}"</strong> has been successfully completed.</p>
          
          <div class="details-box">
            <h3>Final Summary:</h3>
            <ul>
              <li><strong>Total Value:</strong> $${data.totalAmount}</li>
              <li><strong>Duration:</strong> ${data.duration}</li>
              <li><strong>Completion Date:</strong> ${data.completedAt}</li>
              <li><strong>Final Status:</strong> ${data.finalStatus}</li>
            </ul>
          </div>
          
          <span class="status-badge status-low">COMPLETED</span>
          <p>Thank you for another successful collaboration on Axees!</p>
          <a class="button" href="${process.env.FRONTEND_URL}/deals/${data.dealId}/summary">View Final Summary</a>
        </div>
      `
    }
  };
  
  return templates[type] || templates.offer_created;
};

// Send comprehensive notification
exports.sendOfferStatusNotification = async (req, res) => {
  try {
    const {
      userId,
      notificationType,
      dealId,
      offerId,
      data = {},
      channels = ['push', 'in_app'],
      priority = 'medium',
      scheduledFor = null
    } = req.body;

    if (!userId || !notificationType) {
      return errorResponse(res, "User ID and notification type are required", 400);
    }

    // Get user and their notification preferences
    const user = await User.findById(userId).select('+email +deviceToken +notificationPreferences');
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Get notification configuration
    const notificationConfig = NOTIFICATION_TYPES[notificationType] || NOTIFICATION_TYPES.OFFER_CREATED;
    
    // Merge with user preferences
    const effectiveChannels = channels.filter(channel => {
      if (!user.notificationPreferences) return true;
      return user.notificationPreferences[channel] !== false;
    });

    // Prepare notification data
    const notificationData = {
      user: userId,
      type: notificationType.toLowerCase(),
      title: notificationConfig.title,
      subtitle: data.message || `Update for ${data.dealName || data.offerName || 'your collaboration'}`,
      unread: true,
      priority: priority,
      data: {
        ...data,
        dealId: dealId || data.dealId,
        offerId: offerId || data.offerId,
        notificationType,
        targetScreen: getTargetScreen(notificationType, data)
      },
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      channels: effectiveChannels
    };

    // Create in-app notification
    if (effectiveChannels.includes('in_app')) {
      const notification = await Notification.create(notificationData);
      console.log(`✅ In-app notification created: ${notification._id}`);
    }

    // Send push notification
    if (effectiveChannels.includes('push') && user.deviceToken) {
      await sendPushNotification(user.deviceToken, notificationConfig.title, notificationData.subtitle, notificationData.data);
      console.log(`✅ Push notification sent to ${user.userName}`);
    }

    // Send email notification
    if (effectiveChannels.includes('email') && user.email) {
      await sendEmailNotification(user.email, notificationType, data);
      console.log(`✅ Email notification sent to ${user.email}`);
    }

    // Log notification activity
    await logNotificationActivity(userId, notificationType, effectiveChannels, priority);

    return successResponse(res, "Comprehensive notification sent successfully", {
      notificationType,
      channels: effectiveChannels,
      priority,
      userId,
      scheduledFor: notificationData.scheduledFor
    });

  } catch (error) {
    console.error("Error sending offer status notification:", error);
    return handleServerError(res, error);
  }
};

// Bulk notification sending
exports.sendBulkStatusNotifications = async (req, res) => {
  try {
    const { notifications } = req.body;

    if (!notifications || !Array.isArray(notifications)) {
      return errorResponse(res, "Notifications array is required", 400);
    }

    const results = [];
    const errors = [];

    for (const notificationData of notifications) {
      try {
        const result = await this.sendOfferStatusNotification({
          body: notificationData
        }, { 
          json: (data) => data // Mock response object
        });
        
        results.push({
          userId: notificationData.userId,
          type: notificationData.notificationType,
          status: 'sent',
          result
        });
      } catch (error) {
        errors.push({
          userId: notificationData.userId,
          type: notificationData.notificationType,
          status: 'failed',
          error: error.message
        });
      }
    }

    return successResponse(res, "Bulk notifications processed", {
      total: notifications.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error("Error sending bulk notifications:", error);
    return handleServerError(res, error);
  }
};

// Get notification preferences
exports.getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('+notificationPreferences');
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const defaultPreferences = {
      push: true,
      email: true,
      in_app: true,
      sms: false,
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      },
      categories: {
        offers: true,
        payments: true,
        milestones: true,
        content: true,
        reminders: true
      }
    };

    const preferences = user.notificationPreferences || defaultPreferences;

    return successResponse(res, "Notification preferences retrieved successfully", {
      preferences,
      availableTypes: Object.keys(NOTIFICATION_TYPES),
      channels: ['push', 'email', 'in_app', 'sms']
    });

  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return handleServerError(res, error);
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    if (!preferences) {
      return errorResponse(res, "Preferences object is required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Update preferences
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...preferences,
      updatedAt: new Date()
    };

    await user.save();

    return successResponse(res, "Notification preferences updated successfully", {
      preferences: user.notificationPreferences
    });

  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return handleServerError(res, error);
  }
};

// Get notification history and analytics
exports.getNotificationAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get notifications for user
    const notifications = await Notification.find({
      user: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    // Calculate analytics
    const analytics = {
      total: notifications.length,
      unread: notifications.filter(n => n.unread).length,
      byType: {},
      byPriority: {},
      readRate: 0,
      averageResponseTime: 0,
      channelPerformance: {}
    };

    // Group by type
    notifications.forEach(n => {
      analytics.byType[n.type] = (analytics.byType[n.type] || 0) + 1;
      analytics.byPriority[n.priority] = (analytics.byPriority[n.priority] || 0) + 1;
    });

    // Calculate read rate
    if (notifications.length > 0) {
      analytics.readRate = ((notifications.length - analytics.unread) / notifications.length * 100).toFixed(1);
    }

    return successResponse(res, "Notification analytics retrieved successfully", {
      timeframe,
      analytics,
      recentNotifications: notifications.slice(0, 10),
      recommendations: generateNotificationRecommendations(analytics, notifications)
    });

  } catch (error) {
    console.error("Error getting notification analytics:", error);
    return handleServerError(res, error);
  }
};

// Helper functions
const getTargetScreen = (notificationType, data) => {
  const screenMap = {
    OFFER_CREATED: 'OfferDetails',
    OFFER_ACCEPTED: 'DealPayment',
    OFFER_REJECTED: 'OfferHistory',
    DEAL_PAYMENT_REQUIRED: 'PaymentScreen',
    CONTENT_SUBMITTED: 'ContentReview',
    CONTENT_APPROVED: 'DealProgress',
    MILESTONE_DUE: 'MilestoneDetails',
    DEAL_COMPLETED: 'DealSummary'
  };
  
  return screenMap[notificationType] || 'Dashboard';
};

const sendPushNotification = async (deviceToken, title, body, data = {}) => {
  try {
    // Implementation would depend on your push notification service (FCM, etc.)
    console.log(`📱 Push notification: ${title} - ${body}`);
    // TODO: Implement actual push notification sending
  } catch (error) {
    console.error('Push notification error:', error);
  }
};

const sendEmailNotification = async (email, notificationType, data) => {
  try {
    const template = getNotificationTemplate(notificationType, data);
    const htmlContent = emailTemplate(template.content, template.subject);

    const mailOptions = {
      from: process.env.EMAIL_FROM || "notifications@axees.com",
      to: email,
      subject: template.subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email notification error:', error);
  }
};

const logNotificationActivity = async (userId, type, channels, priority) => {
  try {
    // Log to analytics system (could be separate collection or external service)
    console.log(`📊 Notification logged: User ${userId}, Type: ${type}, Channels: ${channels.join(',')}, Priority: ${priority}`);
  } catch (error) {
    console.error('Notification logging error:', error);
  }
};

const generateNotificationRecommendations = (analytics, notifications) => {
  const recommendations = [];
  
  if (analytics.unread > analytics.total * 0.7) {
    recommendations.push({
      type: 'high_unread_rate',
      message: 'You have a high unread rate. Consider adjusting notification frequency.',
      action: 'review_preferences'
    });
  }
  
  if (analytics.byPriority.high > analytics.total * 0.5) {
    recommendations.push({
      type: 'high_priority_overload',
      message: 'Many high-priority notifications. Consider prioritizing critical actions.',
      action: 'focus_high_priority'
    });
  }
  
  return recommendations;
};

module.exports = exports;