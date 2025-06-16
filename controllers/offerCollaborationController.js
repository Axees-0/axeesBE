const OfferCollaborationService = require('../services/offerCollaborationService');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');

/**
 * Offer Collaboration Controller
 * Handles real-time collaboration API endpoints for offer editing (Bug #3)
 */

// Start editing session for real-time collaboration
exports.startEditingSession = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId, section = 'general' } = req.body;

    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    const result = await OfferCollaborationService.startEditingSession(offerId, userId, section);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, "Editing session started successfully", {
      session: result.session,
      collaborators: result.collaborators,
      offerVersion: result.offerVersion,
      pollInterval: 5000 // Recommend 5-second polling for real-time feel
    });

  } catch (error) {
    console.error("Error starting editing session:", error);
    return handleServerError(res, error);
  }
};

// Update editing activity (heartbeat for active editing)
exports.updateEditingActivity = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId, section, changes = {}, activity } = req.body;

    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    const result = await OfferCollaborationService.updateEditingActivity(offerId, userId, section, changes);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, "Activity updated successfully", {
      activeCollaborators: result.activeCollaborators,
      sectionActivity: result.sectionActivity,
      lastUpdate: new Date()
    });

  } catch (error) {
    console.error("Error updating editing activity:", error);
    return handleServerError(res, error);
  }
};

// End editing session
exports.endEditingSession = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    const result = await OfferCollaborationService.endEditingSession(offerId, userId);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, "Editing session ended successfully", {
      remainingCollaborators: result.remainingCollaborators
    });

  } catch (error) {
    console.error("Error ending editing session:", error);
    return handleServerError(res, error);
  }
};

// Get active collaborators (polling endpoint)
exports.getActiveCollaborators = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    const result = await OfferCollaborationService.getActiveCollaborators(offerId, userId);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, "Active collaborators retrieved successfully", {
      collaborators: result.collaborators,
      sectionActivity: result.sectionActivity,
      offerVersion: result.offerVersion,
      hasActiveCollaborators: result.hasActiveCollaborators,
      nextPoll: Date.now() + 5000 // Suggest next poll time
    });

  } catch (error) {
    console.error("Error getting active collaborators:", error);
    return handleServerError(res, error);
  }
};

// Check for conflicts before saving
exports.checkConflicts = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId, clientVersion, sections } = req.body;

    if (!userId || !clientVersion || !sections) {
      return errorResponse(res, "userId, clientVersion, and sections are required", 400);
    }

    const result = await OfferCollaborationService.checkForConflicts(
      offerId, 
      userId, 
      clientVersion, 
      sections
    );
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, "Conflict check completed", {
      hasConflicts: result.hasConflicts,
      conflicts: result.conflicts,
      warnings: result.warnings,
      canProceed: result.canProceed,
      serverVersion: result.serverVersion,
      recommendations: result.recommendations
    });

  } catch (error) {
    console.error("Error checking conflicts:", error);
    return handleServerError(res, error);
  }
};

// Apply changes with conflict resolution
exports.applyChanges = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { 
      userId, 
      changes, 
      resolutionStrategy = 'merge',
      forceOverride = false 
    } = req.body;

    if (!userId || !changes) {
      return errorResponse(res, "userId and changes are required", 400);
    }

    const strategy = forceOverride ? 'force_override' : resolutionStrategy;
    const result = await OfferCollaborationService.applyChangesWithConflictResolution(
      offerId, 
      userId, 
      changes, 
      strategy
    );
    
    if (!result.success) {
      if (result.requiresResolution) {
        return res.status(409).json({
          success: false,
          error: result.error,
          conflicts: result.conflicts,
          requiresResolution: true,
          resolutionOptions: ['merge', 'force_override', 'cancel']
        });
      }
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, "Changes applied successfully", {
      appliedChanges: result.appliedChanges,
      newVersion: result.newVersion,
      conflictsResolved: result.conflictsResolved,
      warningsHandled: result.warningsHandled
    });

  } catch (error) {
    console.error("Error applying changes:", error);
    return handleServerError(res, error);
  }
};

// Get collaboration history for an offer
exports.getCollaborationHistory = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId, limit = 50, page = 1 } = req.query;

    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    const result = await OfferCollaborationService.getCollaborationHistory(
      offerId, 
      userId, 
      parseInt(limit)
    );
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = result.history.slice(startIndex, endIndex);

    return successResponse(res, "Collaboration history retrieved successfully", {
      history: paginatedHistory,
      pagination: {
        currentPage: parseInt(page),
        totalItems: result.history.length,
        itemsPerPage: parseInt(limit),
        totalPages: Math.ceil(result.history.length / parseInt(limit))
      },
      totalActivities: result.totalActivities
    });

  } catch (error) {
    console.error("Error getting collaboration history:", error);
    return handleServerError(res, error);
  }
};

// Get collaboration status for offer (quick status check)
exports.getCollaborationStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    const collaboratorsResult = await OfferCollaborationService.getActiveCollaborators(offerId, userId);
    
    if (!collaboratorsResult.success) {
      return errorResponse(res, collaboratorsResult.error, 400);
    }

    const status = {
      isCollaborating: collaboratorsResult.hasActiveCollaborators,
      totalCollaborators: collaboratorsResult.collaborators.length,
      currentUserActive: collaboratorsResult.collaborators.some(c => c.userId === userId),
      sectionsBeingEdited: Object.keys(collaboratorsResult.sectionActivity || {}),
      lastActivity: collaboratorsResult.collaborators.length > 0 ? 
        Math.max(...collaboratorsResult.collaborators.map(c => new Date(c.lastActivity))) : 
        null,
      offerVersion: collaboratorsResult.offerVersion
    };

    return successResponse(res, "Collaboration status retrieved successfully", status);

  } catch (error) {
    console.error("Error getting collaboration status:", error);
    return handleServerError(res, error);
  }
};

// Force end all sessions (admin/cleanup endpoint)
exports.forceEndAllSessions = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId, reason = 'Manual cleanup' } = req.body;

    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    // Get current collaborators first
    const collaboratorsResult = await OfferCollaborationService.getActiveCollaborators(offerId, userId);
    
    if (!collaboratorsResult.success) {
      return errorResponse(res, collaboratorsResult.error, 400);
    }

    const endedSessions = [];
    
    // End sessions for all active collaborators
    for (const collaborator of collaboratorsResult.collaborators) {
      const result = await OfferCollaborationService.endEditingSession(offerId, collaborator.userId);
      if (result.success) {
        endedSessions.push({
          userId: collaborator.userId,
          userName: collaborator.userName,
          sessionDuration: new Date() - new Date(collaborator.startedAt)
        });
      }
    }

    return successResponse(res, "All editing sessions ended successfully", {
      endedSessions,
      reason,
      totalSessionsEnded: endedSessions.length
    });

  } catch (error) {
    console.error("Error force ending all sessions:", error);
    return handleServerError(res, error);
  }
};

module.exports = exports;