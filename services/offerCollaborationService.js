const User = require('../models/User');
const Offer = require('../models/offer');
const Notification = require('../models/Notification');
const NodeCache = require('node-cache');

/**
 * Offer Collaboration Service
 * Handles real-time collaboration features for offer editing (Bug #3)
 * Uses polling-based approach with conflict detection and optimistic locking
 */

// Cache for active editing sessions (TTL: 30 seconds)
const editingSessionsCache = new NodeCache({ stdTTL: 30, checkperiod: 10 });

// Cache for offer versions to detect conflicts (TTL: 5 minutes)
const offerVersionCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

class OfferCollaborationService {

  // Start editing session for a user on specific offer
  static async startEditingSession(offerId, userId, section = 'general') {
    try {
      const offer = await Offer.findById(offerId)
        .populate('marketerId', 'name email avatar')
        .populate('creatorId', 'name email avatar');
      
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Verify user has edit access
      const hasAccess = String(offer.marketerId._id) === userId || 
                       String(offer.creatorId._id) === userId;
      
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const user = await User.findById(userId).select('name email avatar');
      const sessionKey = `editing_${offerId}`;
      
      // Get current editing sessions for this offer
      let currentSessions = editingSessionsCache.get(sessionKey) || {};
      
      // Add/update this user's session
      currentSessions[userId] = {
        userId,
        userName: user.name,
        userEmail: user.email,
        userAvatar: user.avatar,
        section,
        startedAt: new Date(),
        lastActivity: new Date(),
        sessionId: `${userId}_${Date.now()}`
      };

      // Store updated sessions
      editingSessionsCache.set(sessionKey, currentSessions);

      // Store offer version for conflict detection
      const versionKey = `version_${offerId}`;
      if (!offerVersionCache.get(versionKey)) {
        offerVersionCache.set(versionKey, {
          version: offer.updatedAt.getTime(),
          lastModifiedBy: null,
          sections: {}
        });
      }

      // Notify other editors about new collaboration session
      await this.notifyCollaborators(offer, currentSessions, userId, 'joined');

      return {
        success: true,
        session: currentSessions[userId],
        collaborators: Object.values(currentSessions).filter(s => s.userId !== userId),
        offerVersion: offer.updatedAt.getTime()
      };

    } catch (error) {
      console.error('Error starting editing session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update editing session activity
  static async updateEditingActivity(offerId, userId, section, changes = {}) {
    try {
      const sessionKey = `editing_${offerId}`;
      let currentSessions = editingSessionsCache.get(sessionKey) || {};
      
      if (currentSessions[userId]) {
        currentSessions[userId].lastActivity = new Date();
        currentSessions[userId].section = section;
        currentSessions[userId].pendingChanges = changes;
        
        editingSessionsCache.set(sessionKey, currentSessions);
        
        // Update section activity in version cache
        const versionKey = `version_${offerId}`;
        let versionData = offerVersionCache.get(versionKey) || {};
        if (!versionData.sections) versionData.sections = {};
        
        versionData.sections[section] = {
          lastEditedBy: userId,
          lastEditedAt: new Date(),
          pendingChanges: changes
        };
        
        offerVersionCache.set(versionKey, versionData);

        return {
          success: true,
          activeCollaborators: Object.values(currentSessions),
          sectionActivity: versionData.sections
        };
      }

      return {
        success: false,
        error: 'No active editing session found'
      };

    } catch (error) {
      console.error('Error updating editing activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // End editing session
  static async endEditingSession(offerId, userId) {
    try {
      const sessionKey = `editing_${offerId}`;
      let currentSessions = editingSessionsCache.get(sessionKey) || {};
      
      if (currentSessions[userId]) {
        const offer = await Offer.findById(offerId)
          .populate('marketerId', 'name email')
          .populate('creatorId', 'name email');

        // Notify other collaborators about user leaving
        await this.notifyCollaborators(offer, currentSessions, userId, 'left');
        
        delete currentSessions[userId];
        editingSessionsCache.set(sessionKey, currentSessions);
        
        return {
          success: true,
          remainingCollaborators: Object.values(currentSessions)
        };
      }

      return {
        success: false,
        error: 'No active editing session found'
      };

    } catch (error) {
      console.error('Error ending editing session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get current collaborators for an offer
  static async getActiveCollaborators(offerId, userId) {
    try {
      const offer = await Offer.findById(offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Verify user has access
      const hasAccess = String(offer.marketerId) === userId || 
                       String(offer.creatorId) === userId;
      
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const sessionKey = `editing_${offerId}`;
      const currentSessions = editingSessionsCache.get(sessionKey) || {};
      const versionKey = `version_${offerId}`;
      const versionData = offerVersionCache.get(versionKey) || {};

      return {
        success: true,
        collaborators: Object.values(currentSessions),
        sectionActivity: versionData.sections || {},
        offerVersion: offer.updatedAt.getTime(),
        hasActiveCollaborators: Object.keys(currentSessions).length > 1
      };

    } catch (error) {
      console.error('Error getting active collaborators:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check for conflicts before saving changes
  static async checkForConflicts(offerId, userId, clientVersion, sectionChanges) {
    try {
      const offer = await Offer.findById(offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      const serverVersion = offer.updatedAt.getTime();
      const versionKey = `version_${offerId}`;
      const versionData = offerVersionCache.get(versionKey) || {};

      const conflicts = [];
      const warnings = [];

      // Check version conflict
      if (clientVersion < serverVersion) {
        conflicts.push({
          type: 'version_conflict',
          message: 'Offer has been modified by another user',
          serverVersion,
          clientVersion,
          conflictedBy: versionData.lastModifiedBy
        });
      }

      // Check section-level conflicts
      for (const [section, changes] of Object.entries(sectionChanges)) {
        const sectionActivity = versionData.sections?.[section];
        
        if (sectionActivity && sectionActivity.lastEditedBy !== userId) {
          const timeDiff = new Date() - new Date(sectionActivity.lastEditedAt);
          
          if (timeDiff < 60000) { // Less than 1 minute ago
            conflicts.push({
              type: 'section_conflict',
              section,
              message: `Section "${section}" is being edited by another user`,
              conflictedBy: sectionActivity.lastEditedBy,
              conflictedAt: sectionActivity.lastEditedAt,
              pendingChanges: sectionActivity.pendingChanges
            });
          } else if (timeDiff < 300000) { // Less than 5 minutes ago
            warnings.push({
              type: 'recent_activity',
              section,
              message: `Section "${section}" was recently edited by another user`,
              lastEditedBy: sectionActivity.lastEditedBy,
              lastEditedAt: sectionActivity.lastEditedAt
            });
          }
        }
      }

      return {
        success: true,
        hasConflicts: conflicts.length > 0,
        conflicts,
        warnings,
        canProceed: conflicts.length === 0,
        serverVersion,
        recommendations: this.generateConflictResolutionRecommendations(conflicts, warnings)
      };

    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Apply changes with conflict resolution
  static async applyChangesWithConflictResolution(offerId, userId, changes, resolutionStrategy = 'merge') {
    try {
      const offer = await Offer.findById(offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Check conflicts first
      const conflictCheck = await this.checkForConflicts(offerId, userId, changes.clientVersion, changes.sections);
      
      if (conflictCheck.hasConflicts && resolutionStrategy !== 'force_override') {
        return {
          success: false,
          error: 'Conflicts detected',
          conflicts: conflictCheck.conflicts,
          requiresResolution: true
        };
      }

      // Apply changes based on resolution strategy
      let appliedChanges = {};
      
      for (const [section, sectionChanges] of Object.entries(changes.sections)) {
        appliedChanges[section] = await this.applySectionChanges(offer, section, sectionChanges, resolutionStrategy);
      }

      // Update offer version
      offer.updatedAt = new Date();
      await offer.save();

      // Update version cache
      const versionKey = `version_${offerId}`;
      offerVersionCache.set(versionKey, {
        version: offer.updatedAt.getTime(),
        lastModifiedBy: userId,
        sections: {}
      });

      // Notify collaborators about changes
      const sessionKey = `editing_${offerId}`;
      const currentSessions = editingSessionsCache.get(sessionKey) || {};
      await this.notifyCollaborators(offer, currentSessions, userId, 'updated', appliedChanges);

      return {
        success: true,
        appliedChanges,
        newVersion: offer.updatedAt.getTime(),
        conflictsResolved: conflictCheck.conflicts.length,
        warningsHandled: conflictCheck.warnings.length
      };

    } catch (error) {
      console.error('Error applying changes with conflict resolution:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get collaboration history for an offer
  static async getCollaborationHistory(offerId, userId, limit = 50) {
    try {
      const offer = await Offer.findById(offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Verify access
      const hasAccess = String(offer.marketerId) === userId || 
                       String(offer.creatorId) === userId;
      
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get collaboration activities from notifications
      const collaborationNotifications = await Notification.find({
        'data.offerId': offerId,
        type: { $in: ['offer_collaboration_joined', 'offer_collaboration_left', 'offer_collaboration_updated'] }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email avatar');

      const history = collaborationNotifications.map(notification => ({
        id: notification._id,
        type: notification.type,
        user: {
          id: notification.userId._id,
          name: notification.userId.name,
          email: notification.userId.email,
          avatar: notification.userId.avatar
        },
        timestamp: notification.createdAt,
        action: notification.data.action,
        section: notification.data.section,
        changes: notification.data.changes || {},
        metadata: notification.data.metadata || {}
      }));

      return {
        success: true,
        history,
        totalActivities: history.length
      };

    } catch (error) {
      console.error('Error getting collaboration history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper method to apply section changes
  static async applySectionChanges(offer, section, changes, strategy) {
    const appliedChanges = {};

    switch (section) {
      case 'basic_info':
        if (changes.offerName) {
          offer.offerName = changes.offerName;
          appliedChanges.offerName = changes.offerName;
        }
        if (changes.description) {
          offer.description = changes.description;
          appliedChanges.description = changes.description;
        }
        break;

      case 'pricing':
        if (changes.proposedAmount) {
          offer.proposedAmount = changes.proposedAmount;
          appliedChanges.proposedAmount = changes.proposedAmount;
        }
        break;

      case 'timeline':
        if (changes.desiredReviewDate) {
          offer.desiredReviewDate = new Date(changes.desiredReviewDate);
          appliedChanges.desiredReviewDate = changes.desiredReviewDate;
        }
        if (changes.desiredPostDate) {
          offer.desiredPostDate = new Date(changes.desiredPostDate);
          appliedChanges.desiredPostDate = changes.desiredPostDate;
        }
        break;

      case 'deliverables':
        if (changes.deliverables) {
          if (strategy === 'merge' && Array.isArray(offer.deliverables)) {
            // Merge deliverables
            offer.deliverables = [...new Set([...offer.deliverables, ...changes.deliverables])];
          } else {
            offer.deliverables = changes.deliverables;
          }
          appliedChanges.deliverables = offer.deliverables;
        }
        break;

      case 'platforms':
        if (changes.platforms) {
          if (strategy === 'merge' && Array.isArray(offer.platforms)) {
            offer.platforms = [...new Set([...offer.platforms, ...changes.platforms])];
          } else {
            offer.platforms = changes.platforms;
          }
          appliedChanges.platforms = offer.platforms;
        }
        break;
    }

    return appliedChanges;
  }

  // Helper method to notify collaborators
  static async notifyCollaborators(offer, sessions, excludeUserId, action, changes = {}) {
    try {
      const collaborators = Object.values(sessions).filter(s => s.userId !== excludeUserId);
      
      for (const collaborator of collaborators) {
        const notification = new Notification({
          userId: collaborator.userId,
          type: `offer_collaboration_${action}`,
          title: 'Offer Collaboration Update',
          message: this.generateCollaborationMessage(offer, action, sessions[excludeUserId], changes),
          data: {
            offerId: offer._id,
            action,
            collaboratorId: excludeUserId,
            collaboratorName: sessions[excludeUserId]?.userName,
            changes,
            metadata: {
              totalCollaborators: Object.keys(sessions).length,
              offerName: offer.offerName
            }
          }
        });
        
        await notification.save();
      }
    } catch (error) {
      console.warn('Error notifying collaborators:', error.message);
    }
  }

  // Helper method to generate collaboration messages
  static generateCollaborationMessage(offer, action, user, changes) {
    const userName = user?.userName || 'A user';
    const offerName = offer.offerName || 'the offer';

    switch (action) {
      case 'joined':
        return `${userName} started editing "${offerName}"`;
      case 'left':
        return `${userName} stopped editing "${offerName}"`;
      case 'updated':
        const changedSections = Object.keys(changes).join(', ');
        return `${userName} updated ${changedSections} in "${offerName}"`;
      default:
        return `${userName} made changes to "${offerName}"`;
    }
  }

  // Helper method to generate conflict resolution recommendations
  static generateConflictResolutionRecommendations(conflicts, warnings) {
    const recommendations = [];

    if (conflicts.some(c => c.type === 'version_conflict')) {
      recommendations.push({
        type: 'refresh_and_merge',
        priority: 'high',
        title: 'Refresh and Merge Changes',
        description: 'Refresh the offer to get the latest version, then reapply your changes',
        action: 'refresh_offer'
      });
    }

    if (conflicts.some(c => c.type === 'section_conflict')) {
      recommendations.push({
        type: 'coordinate_with_collaborator',
        priority: 'high',
        title: 'Coordinate with Collaborator',
        description: 'Another user is actively editing the same section. Consider coordinating your changes',
        action: 'contact_collaborator'
      });
    }

    if (warnings.length > 0) {
      recommendations.push({
        type: 'review_recent_changes',
        priority: 'medium',
        title: 'Review Recent Changes',
        description: 'Recent changes were made to sections you\'re editing. Review them before proceeding',
        action: 'show_changes'
      });
    }

    return recommendations;
  }
}

module.exports = OfferCollaborationService;