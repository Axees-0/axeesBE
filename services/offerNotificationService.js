const { sendTemplatedEmail, validateEmail } = require('../utils/emailHelper');
const User = require('../models/User');
const Offer = require('../models/offer');
const Deal = require('../models/deal');

/**
 * Offer Notification Service
 * Enhanced notification system for offer-related events (Bug #2)
 * Ensures accurate recipient emails and proper validation
 */

class OfferNotificationService {
  
  // Send offer submission notification
  static async sendOfferNotification(offerId, options = {}) {
    try {
      const offer = await Offer.findById(offerId)
        .populate('marketerId', 'name userName email')
        .populate('creatorId', 'name userName email');

      if (!offer) {
        throw new Error('Offer not found');
      }

      // Validate and prepare recipient email
      const recipientEmail = await this.validateRecipientEmail(offer.creatorId);
      if (!recipientEmail.isValid) {
        throw new Error(`Invalid recipient email: ${recipientEmail.errors.join(', ')}`);
      }

      // Prepare template data
      const templateData = {
        recipientName: offer.creatorId.name || offer.creatorId.userName,
        marketerName: offer.marketerId.name || offer.marketerId.userName,
        offerName: offer.offerName,
        amount: offer.proposedAmount,
        platforms: Array.isArray(offer.platforms) ? offer.platforms.join(', ') : offer.platforms || 'Not specified',
        deadline: offer.desiredPostDate ? new Date(offer.desiredPostDate).toLocaleDateString() : 'Not specified',
        viewOfferUrl: `${process.env.FRONTEND_URL}/offers/${offer._id}`,
        description: offer.description || ''
      };

      // Send notification email
      const result = await sendTemplatedEmail('OFFER_SENT', recipientEmail.email, templateData);
      
      // Log notification attempt
      await this.logNotification({
        type: 'offer_sent',
        offerId: offer._id,
        recipientId: offer.creatorId._id,
        recipientEmail: recipientEmail.email,
        success: result.success,
        errors: result.errors
      });

      return result;
      
    } catch (error) {
      console.error('Error sending offer notification:', error);
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  // Send offer acceptance notification
  static async sendAcceptanceNotification(offerId, options = {}) {
    try {
      const offer = await Offer.findById(offerId)
        .populate('marketerId', 'name userName email')
        .populate('creatorId', 'name userName email');

      if (!offer) {
        throw new Error('Offer not found');
      }

      // Validate marketer email
      const recipientEmail = await this.validateRecipientEmail(offer.marketerId);
      if (!recipientEmail.isValid) {
        throw new Error(`Invalid recipient email: ${recipientEmail.errors.join(', ')}`);
      }

      const templateData = {
        marketerName: offer.marketerId.name || offer.marketerId.userName,
        creatorName: offer.creatorId.name || offer.creatorId.userName,
        offerName: offer.offerName,
        amount: offer.proposedAmount,
        viewDealUrl: `${process.env.FRONTEND_URL}/deals`,
        acceptedAt: new Date().toLocaleDateString()
      };

      const result = await sendTemplatedEmail('OFFER_ACCEPTED', recipientEmail.email, templateData);
      
      await this.logNotification({
        type: 'offer_accepted',
        offerId: offer._id,
        recipientId: offer.marketerId._id,
        recipientEmail: recipientEmail.email,
        success: result.success,
        errors: result.errors
      });

      return result;
      
    } catch (error) {
      console.error('Error sending acceptance notification:', error);
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  // Send counter offer notification
  static async sendCounterOfferNotification(offerId, counterData, options = {}) {
    try {
      const offer = await Offer.findById(offerId)
        .populate('marketerId', 'name userName email')
        .populate('creatorId', 'name userName email');

      if (!offer) {
        throw new Error('Offer not found');
      }

      // Determine recipient (opposite of who sent the counter)
      const isCounterByCreator = counterData.counterBy === 'Creator';
      const recipient = isCounterByCreator ? offer.marketerId : offer.creatorId;
      const sender = isCounterByCreator ? offer.creatorId : offer.marketerId;

      const recipientEmail = await this.validateRecipientEmail(recipient);
      if (!recipientEmail.isValid) {
        throw new Error(`Invalid recipient email: ${recipientEmail.errors.join(', ')}`);
      }

      const templateData = {
        recipientName: recipient.name || recipient.userName,
        senderName: sender.name || sender.userName,
        offerName: offer.offerName,
        counterAmount: counterData.counterAmount || 'No change',
        notes: counterData.notes || 'No additional notes',
        viewOfferUrl: `${process.env.FRONTEND_URL}/offers/${offer._id}`,
        counterDate: new Date().toLocaleDateString()
      };

      const result = await sendTemplatedEmail('COUNTER_OFFER', recipientEmail.email, templateData);
      
      await this.logNotification({
        type: 'counter_offer',
        offerId: offer._id,
        recipientId: recipient._id,
        recipientEmail: recipientEmail.email,
        success: result.success,
        errors: result.errors
      });

      return result;
      
    } catch (error) {
      console.error('Error sending counter offer notification:', error);
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  // Send deal creation notification
  static async sendDealCreationNotification(dealId, options = {}) {
    try {
      const deal = await Deal.findById(dealId)
        .populate('marketerId', 'name userName email')
        .populate('creatorId', 'name userName email');

      if (!deal) {
        throw new Error('Deal not found');
      }

      // Send notifications to both parties
      const notifications = [];
      
      for (const user of [deal.marketerId, deal.creatorId]) {
        const recipientEmail = await this.validateRecipientEmail(user);
        if (!recipientEmail.isValid) {
          console.warn(`Skipping notification for invalid email: ${recipientEmail.errors.join(', ')}`);
          continue;
        }

        const otherParty = user._id.toString() === deal.marketerId._id.toString() ? 
          deal.creatorId : deal.marketerId;

        const templateData = {
          recipientName: user.name || user.userName,
          otherPartyName: otherParty.name || otherParty.userName,
          dealName: deal.dealName,
          amount: deal.paymentInfo.paymentAmount,
          userRole: user._id.toString() === deal.marketerId._id.toString() ? 'marketer' : 'creator',
          viewDealUrl: `${process.env.FRONTEND_URL}/deals/${deal._id}`,
          createdAt: new Date().toLocaleDateString()
        };

        const result = await sendTemplatedEmail('DEAL_CREATED', recipientEmail.email, templateData);
        
        await this.logNotification({
          type: 'deal_created',
          dealId: deal._id,
          recipientId: user._id,
          recipientEmail: recipientEmail.email,
          success: result.success,
          errors: result.errors
        });

        notifications.push(result);
      }

      return {
        success: notifications.some(n => n.success),
        results: notifications
      };
      
    } catch (error) {
      console.error('Error sending deal creation notification:', error);
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  // Send profile completion reminder
  static async sendProfileCompletionReminder(userId, completionData, options = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const recipientEmail = await this.validateRecipientEmail(user);
      if (!recipientEmail.isValid) {
        throw new Error(`Invalid recipient email: ${recipientEmail.errors.join(', ')}`);
      }

      // Format missing fields for template
      const missingFields = completionData.missingFields || [];
      const missingFieldsList = missingFields.map(field => `<li>${field}</li>`).join('');

      const templateData = {
        userName: user.name || user.userName,
        completionPercentage: completionData.completionPercentage || 0,
        missingFields: missingFieldsList,
        profileUrl: `${process.env.FRONTEND_URL}/profile/edit`,
        requiredForOffers: true
      };

      const result = await sendTemplatedEmail('PROFILE_COMPLETION', recipientEmail.email, templateData);
      
      await this.logNotification({
        type: 'profile_completion',
        recipientId: user._id,
        recipientEmail: recipientEmail.email,
        success: result.success,
        errors: result.errors
      });

      return result;
      
    } catch (error) {
      console.error('Error sending profile completion reminder:', error);
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  // Validate recipient email with enhanced checks
  static async validateRecipientEmail(user) {
    const result = {
      isValid: false,
      email: null,
      errors: [],
      suggestions: []
    };

    if (!user || !user.email) {
      result.errors.push('User email not found');
      return result;
    }

    // Use enhanced email validation
    const validation = await validateEmail(user.email);
    
    result.isValid = validation.isValid;
    result.email = user.email.trim().toLowerCase();
    result.errors = validation.errors;
    result.suggestions = validation.suggestions;

    // Additional checks specific to our system
    if (result.isValid) {
      // Check if user has opted out of notifications
      if (user.settings && user.settings.notifications && user.settings.notifications.email === false) {
        result.isValid = false;
        result.errors.push('User has opted out of email notifications');
      }

      // Check if email is verified (if required)
      if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.emailVerified) {
        result.isValid = false;
        result.errors.push('Email address not verified');
      }
    }

    return result;
  }

  // Log notification attempts for debugging and analytics
  static async logNotification(data) {
    try {
      // In a real implementation, this would write to a notifications log collection
      console.log('Notification log:', {
        timestamp: new Date(),
        ...data
      });

      // Could also save to database for analytics
      // await NotificationLog.create(data);
      
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Batch send notifications with error handling
  static async sendBatchNotifications(notifications) {
    const results = [];
    
    for (const notification of notifications) {
      try {
        let result;
        
        switch (notification.type) {
          case 'offer_sent':
            result = await this.sendOfferNotification(notification.offerId, notification.options);
            break;
          case 'offer_accepted':
            result = await this.sendAcceptanceNotification(notification.offerId, notification.options);
            break;
          case 'counter_offer':
            result = await this.sendCounterOfferNotification(notification.offerId, notification.counterData, notification.options);
            break;
          case 'deal_created':
            result = await this.sendDealCreationNotification(notification.dealId, notification.options);
            break;
          case 'profile_completion':
            result = await this.sendProfileCompletionReminder(notification.userId, notification.completionData, notification.options);
            break;
          default:
            result = { success: false, errors: ['Unknown notification type'] };
        }
        
        results.push({ ...notification, result });
        
      } catch (error) {
        results.push({ 
          ...notification, 
          result: { success: false, errors: [error.message] }
        });
      }
    }
    
    return results;
  }

  // Get notification statistics
  static async getNotificationStats(timeframe = '24h') {
    // In a real implementation, this would query the notification logs
    return {
      sent: 0,
      delivered: 0,
      failed: 0,
      bounced: 0,
      opened: 0,
      clicked: 0
    };
  }
}

module.exports = OfferNotificationService;