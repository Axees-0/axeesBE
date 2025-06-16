const Deal = require('../models/deal');
const User = require('../models/User');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');
const mongoose = require('mongoose');

/**
 * Proof Submission Controller
 * Handles proof submissions for deals and milestones
 */

// Submit proof for a deal
exports.submitProof = async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.user.id;
    const { attachments, milestoneId } = req.body;

    // Validate input
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return errorResponse(res, "At least one attachment is required", 400);
    }

    // Validate attachments format
    for (const attachment of attachments) {
      if (!attachment.type || !['image', 'video', 'pdf', 'text', 'link'].includes(attachment.type)) {
        return errorResponse(res, "Invalid attachment type. Must be: image, video, pdf, text, or link", 400);
      }
      
      if (attachment.type !== 'text' && !attachment.url) {
        return errorResponse(res, "URL is required for non-text attachments", 400);
      }
      
      if (attachment.type === 'text' && !attachment.content) {
        return errorResponse(res, "Content is required for text attachments", 400);
      }
    }

    // Find the deal
    const deal = await Deal.findById(dealId).populate('marketerId creatorId', 'name userName email');
    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check if user is the creator (only creators can submit proofs)
    if (deal.creatorId._id.toString() !== userId) {
      return errorResponse(res, "Only the deal creator can submit proofs", 403);
    }

    // If milestoneId provided, validate it exists in the deal
    let milestone = null;
    if (milestoneId) {
      milestone = deal.milestones.find(m => m._id.toString() === milestoneId);
      if (!milestone) {
        return errorResponse(res, "Milestone not found in this deal", 404);
      }
      
      // Check if milestone is in a valid state for proof submission
      if (!['funded', 'in_progress'].includes(milestone.status)) {
        return errorResponse(res, "Can only submit proofs for funded or in-progress milestones", 400);
      }
    }

    // Prepare proof submission
    const proofSubmission = {
      _id: new mongoose.Types.ObjectId(),
      attachments: attachments.map(attachment => ({
        type: attachment.type,
        url: attachment.url || null,
        content: attachment.content || null,
        originalName: attachment.originalName || null,
        submittedAt: new Date()
      })),
      submittedAt: new Date(),
      submittedBy: userId,
      status: 'pending_review',
      feedback: []
    };

    // Add milestone reference if provided
    if (milestoneId) {
      proofSubmission.milestoneId = milestoneId;
    }

    // Add proof submission to deal
    deal.proofSubmissions.push(proofSubmission);

    // Update milestone status if applicable
    if (milestone) {
      milestone.status = 'submitted';
    }

    await deal.save();

    // Send notification to marketer (you might want to implement this)
    // await sendProofSubmissionNotification(deal.marketerId, deal, proofSubmission);

    return successResponse(res, "Proof submitted successfully", {
      proofSubmission: {
        id: proofSubmission._id,
        status: proofSubmission.status,
        submittedAt: proofSubmission.submittedAt,
        attachmentsCount: proofSubmission.attachments.length,
        milestoneId: milestoneId || null
      },
      deal: {
        id: deal._id,
        dealName: deal.dealName,
        status: deal.status
      },
      nextSteps: {
        creator: "Wait for marketer review and feedback",
        marketer: `${deal.marketerId.name} will be notified to review your submission`
      }
    });

  } catch (error) {
    console.error("Error submitting proof:", error);
    return handleServerError(res, error);
  }
};

// Get proof submissions for a deal
exports.getProofSubmissions = async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.user.id;
    const { status, milestoneId, page = 1, limit = 10 } = req.query;

    const deal = await Deal.findById(dealId)
      .populate('marketerId creatorId', 'name userName email')
      .populate('proofSubmissions.submittedBy', 'name userName');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check if user is part of this deal
    const isMarketer = deal.marketerId._id.toString() === userId;
    const isCreator = deal.creatorId._id.toString() === userId;
    
    if (!isMarketer && !isCreator) {
      return errorResponse(res, "You don't have access to this deal", 403);
    }

    // Filter proof submissions
    let proofSubmissions = deal.proofSubmissions;

    // Filter by status if provided
    if (status) {
      proofSubmissions = proofSubmissions.filter(proof => proof.status === status);
    }

    // Filter by milestone if provided
    if (milestoneId) {
      proofSubmissions = proofSubmissions.filter(proof => 
        proof.milestoneId && proof.milestoneId.toString() === milestoneId
      );
    }

    // Sort by submission date (newest first)
    proofSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProofs = proofSubmissions.slice(startIndex, endIndex);

    // Format proof submissions for response
    const formattedProofs = paginatedProofs.map(proof => ({
      id: proof._id,
      status: proof.status,
      submittedAt: proof.submittedAt,
      submittedBy: proof.submittedBy,
      approvedAt: proof.approvedAt || null,
      milestoneId: proof.milestoneId || null,
      attachments: proof.attachments.map(attachment => ({
        type: attachment.type,
        url: attachment.url,
        content: attachment.content ? attachment.content.substring(0, 200) + '...' : null,
        originalName: attachment.originalName,
        submittedAt: attachment.submittedAt
      })),
      feedback: proof.feedback.map(fb => ({
        id: fb._id,
        feedback: fb.feedback,
        createdAt: fb.createdAt,
        createdBy: fb.createdBy
      })),
      canReview: isMarketer && proof.status === 'pending_review',
      canResubmit: isCreator && proof.status === 'revision_required'
    }));

    // Calculate summary statistics
    const summary = {
      totalSubmissions: proofSubmissions.length,
      pendingReview: proofSubmissions.filter(p => p.status === 'pending_review').length,
      approved: proofSubmissions.filter(p => p.status === 'approved').length,
      revisionRequired: proofSubmissions.filter(p => p.status === 'revision_required').length,
      byMilestone: {}
    };

    // Group by milestone
    if (deal.milestones && deal.milestones.length > 0) {
      deal.milestones.forEach(milestone => {
        const milestoneProofs = proofSubmissions.filter(p => 
          p.milestoneId && p.milestoneId.toString() === milestone._id.toString()
        );
        
        summary.byMilestone[milestone._id] = {
          milestoneName: milestone.name,
          submissionsCount: milestoneProofs.length,
          latestStatus: milestoneProofs.length > 0 ? milestoneProofs[0].status : null
        };
      });
    }

    return successResponse(res, "Proof submissions retrieved successfully", {
      proofSubmissions: formattedProofs,
      summary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(proofSubmissions.length / limit),
        totalItems: proofSubmissions.length,
        itemsPerPage: parseInt(limit)
      },
      deal: {
        id: deal._id,
        dealName: deal.dealName,
        status: deal.status,
        userRole: isMarketer ? 'marketer' : 'creator'
      }
    });

  } catch (error) {
    console.error("Error getting proof submissions:", error);
    return handleServerError(res, error);
  }
};

// Review/approve proof submission
exports.reviewProofSubmission = async (req, res) => {
  try {
    const { dealId, proofId } = req.params;
    const userId = req.user.id;
    const { action, feedback } = req.body; // action: 'approve' or 'request_revision'

    // Validate action
    if (!['approve', 'request_revision'].includes(action)) {
      return errorResponse(res, "Action must be 'approve' or 'request_revision'", 400);
    }

    // If requesting revision, feedback is required
    if (action === 'request_revision' && !feedback) {
      return errorResponse(res, "Feedback is required when requesting revisions", 400);
    }

    const deal = await Deal.findById(dealId).populate('marketerId creatorId', 'name userName email');
    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check if user is the marketer (only marketers can review proofs)
    if (deal.marketerId._id.toString() !== userId) {
      return errorResponse(res, "Only the deal marketer can review proofs", 403);
    }

    // Find the proof submission
    const proofSubmission = deal.proofSubmissions.find(proof => proof._id.toString() === proofId);
    if (!proofSubmission) {
      return errorResponse(res, "Proof submission not found", 404);
    }

    // Check if proof is in a reviewable state
    if (proofSubmission.status !== 'pending_review') {
      return errorResponse(res, "This proof submission has already been reviewed", 400);
    }

    // Perform the action
    if (action === 'approve') {
      proofSubmission.status = 'approved';
      proofSubmission.approvedAt = new Date();
      
      // Update related milestone status if applicable
      if (proofSubmission.milestoneId) {
        const milestone = deal.milestones.find(m => m._id.toString() === proofSubmission.milestoneId.toString());
        if (milestone) {
          milestone.status = 'approved';
        }
      }
    } else if (action === 'request_revision') {
      proofSubmission.status = 'revision_required';
      
      // Update related milestone status if applicable
      if (proofSubmission.milestoneId) {
        const milestone = deal.milestones.find(m => m._id.toString() === proofSubmission.milestoneId.toString());
        if (milestone) {
          milestone.status = 'in_progress'; // Reset to in_progress for revision
        }
      }
    }

    // Add feedback if provided
    if (feedback) {
      proofSubmission.feedback.push({
        _id: new mongoose.Types.ObjectId(),
        feedback: feedback,
        createdAt: new Date(),
        createdBy: userId
      });
    }

    await deal.save();

    // Send notification to creator
    // await sendProofReviewNotification(deal.creatorId, deal, proofSubmission, action);

    return successResponse(res, `Proof ${action === 'approve' ? 'approved' : 'revision requested'} successfully`, {
      proofSubmission: {
        id: proofSubmission._id,
        status: proofSubmission.status,
        approvedAt: proofSubmission.approvedAt,
        feedbackCount: proofSubmission.feedback.length
      },
      action,
      nextSteps: action === 'approve' 
        ? {
            creator: "Proof approved! Milestone payment may be released",
            marketer: "You have approved this submission"
          }
        : {
            creator: "Please review feedback and resubmit with revisions",
            marketer: "Creator will be notified to make revisions"
          }
    });

  } catch (error) {
    console.error("Error reviewing proof submission:", error);
    return handleServerError(res, error);
  }
};

// Add feedback to proof submission
exports.addFeedback = async (req, res) => {
  try {
    const { dealId, proofId } = req.params;
    const userId = req.user.id;
    const { feedback } = req.body;

    if (!feedback || feedback.trim().length === 0) {
      return errorResponse(res, "Feedback content is required", 400);
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check if user is part of this deal
    const isMarketer = deal.marketerId.toString() === userId;
    const isCreator = deal.creatorId.toString() === userId;
    
    if (!isMarketer && !isCreator) {
      return errorResponse(res, "You don't have access to this deal", 403);
    }

    // Find the proof submission
    const proofSubmission = deal.proofSubmissions.find(proof => proof._id.toString() === proofId);
    if (!proofSubmission) {
      return errorResponse(res, "Proof submission not found", 404);
    }

    // Add feedback
    const newFeedback = {
      _id: new mongoose.Types.ObjectId(),
      feedback: feedback.trim(),
      createdAt: new Date(),
      createdBy: userId
    };

    proofSubmission.feedback.push(newFeedback);
    await deal.save();

    return successResponse(res, "Feedback added successfully", {
      feedback: {
        id: newFeedback._id,
        feedback: newFeedback.feedback,
        createdAt: newFeedback.createdAt,
        createdBy: newFeedback.createdBy
      },
      proofSubmission: {
        id: proofSubmission._id,
        status: proofSubmission.status,
        totalFeedback: proofSubmission.feedback.length
      }
    });

  } catch (error) {
    console.error("Error adding feedback:", error);
    return handleServerError(res, error);
  }
};

// Get proof submission details
exports.getProofSubmissionDetails = async (req, res) => {
  try {
    const { dealId, proofId } = req.params;
    const userId = req.user.id;

    const deal = await Deal.findById(dealId)
      .populate('marketerId creatorId', 'name userName email')
      .populate('proofSubmissions.submittedBy', 'name userName')
      .populate('proofSubmissions.feedback.createdBy', 'name userName');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check if user is part of this deal
    const isMarketer = deal.marketerId._id.toString() === userId;
    const isCreator = deal.creatorId._id.toString() === userId;
    
    if (!isMarketer && !isCreator) {
      return errorResponse(res, "You don't have access to this deal", 403);
    }

    // Find the proof submission
    const proofSubmission = deal.proofSubmissions.find(proof => proof._id.toString() === proofId);
    if (!proofSubmission) {
      return errorResponse(res, "Proof submission not found", 404);
    }

    // Get related milestone info if applicable
    let milestoneInfo = null;
    if (proofSubmission.milestoneId) {
      const milestone = deal.milestones.find(m => m._id.toString() === proofSubmission.milestoneId.toString());
      if (milestone) {
        milestoneInfo = {
          id: milestone._id,
          name: milestone.name,
          label: milestone.label,
          amount: milestone.amount,
          dueDate: milestone.dueDate,
          status: milestone.status
        };
      }
    }

    // Format detailed response
    const detailedProof = {
      id: proofSubmission._id,
      status: proofSubmission.status,
      submittedAt: proofSubmission.submittedAt,
      submittedBy: proofSubmission.submittedBy,
      approvedAt: proofSubmission.approvedAt,
      milestone: milestoneInfo,
      attachments: proofSubmission.attachments,
      feedback: proofSubmission.feedback.map(fb => ({
        id: fb._id,
        feedback: fb.feedback,
        createdAt: fb.createdAt,
        createdBy: fb.createdBy
      })),
      permissions: {
        canReview: isMarketer && proofSubmission.status === 'pending_review',
        canAddFeedback: true,
        canResubmit: isCreator && proofSubmission.status === 'revision_required'
      }
    };

    return successResponse(res, "Proof submission details retrieved successfully", {
      proofSubmission: detailedProof,
      deal: {
        id: deal._id,
        dealName: deal.dealName,
        status: deal.status,
        participants: {
          marketer: deal.marketerId,
          creator: deal.creatorId
        }
      },
      userRole: isMarketer ? 'marketer' : 'creator'
    });

  } catch (error) {
    console.error("Error getting proof submission details:", error);
    return handleServerError(res, error);
  }
};

// Get proof submission statistics for a user
exports.getProofSubmissionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all deals where user is involved
    const deals = await Deal.find({
      $or: [
        { marketerId: userId },
        { creatorId: userId }
      ]
    }).select('marketerId creatorId proofSubmissions dealName status');

    const stats = {
      asCreator: {
        totalSubmissions: 0,
        pendingReview: 0,
        approved: 0,
        revisionRequired: 0,
        averageReviewTime: 0 // in hours
      },
      asMarketer: {
        totalReceived: 0,
        pendingReview: 0,
        reviewed: 0,
        averageResponseTime: 0 // in hours
      },
      overall: {
        totalProofs: 0,
        activeDeals: deals.filter(d => d.status === 'active').length,
        completedDeals: deals.filter(d => d.status === 'completed').length
      }
    };

    let reviewTimes = [];
    let responseTimes = [];

    deals.forEach(deal => {
      const isCreator = deal.creatorId.toString() === userId;
      const isMarketer = deal.marketerId.toString() === userId;

      deal.proofSubmissions.forEach(proof => {
        stats.overall.totalProofs++;

        if (isCreator && proof.submittedBy.toString() === userId) {
          stats.asCreator.totalSubmissions++;
          
          switch (proof.status) {
            case 'pending_review':
              stats.asCreator.pendingReview++;
              break;
            case 'approved':
              stats.asCreator.approved++;
              if (proof.approvedAt) {
                const reviewTime = (new Date(proof.approvedAt) - new Date(proof.submittedAt)) / (1000 * 60 * 60); // hours
                reviewTimes.push(reviewTime);
              }
              break;
            case 'revision_required':
              stats.asCreator.revisionRequired++;
              break;
          }
        }

        if (isMarketer) {
          stats.asMarketer.totalReceived++;
          
          if (proof.status === 'pending_review') {
            stats.asMarketer.pendingReview++;
          } else {
            stats.asMarketer.reviewed++;
            
            // Calculate response time for reviewed proofs
            if (proof.status !== 'pending_review' && proof.feedback.length > 0) {
              const firstFeedback = proof.feedback[0];
              const responseTime = (new Date(firstFeedback.createdAt) - new Date(proof.submittedAt)) / (1000 * 60 * 60); // hours
              responseTimes.push(responseTime);
            }
          }
        }
      });
    });

    // Calculate averages
    if (reviewTimes.length > 0) {
      stats.asCreator.averageReviewTime = Math.round(reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length);
    }

    if (responseTimes.length > 0) {
      stats.asMarketer.averageResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    }

    return successResponse(res, "Proof submission statistics retrieved successfully", {
      stats,
      insights: generateInsights(stats),
      lastCalculated: new Date()
    });

  } catch (error) {
    console.error("Error getting proof submission stats:", error);
    return handleServerError(res, error);
  }
};

// Helper function to generate insights
const generateInsights = (stats) => {
  const insights = [];

  // For creators
  if (stats.asCreator.totalSubmissions > 0) {
    const approvalRate = Math.round((stats.asCreator.approved / stats.asCreator.totalSubmissions) * 100);
    insights.push(`${approvalRate}% of your submissions are approved on first review`);
    
    if (stats.asCreator.averageReviewTime > 0) {
      insights.push(`Average review time for your submissions: ${stats.asCreator.averageReviewTime} hours`);
    }

    if (stats.asCreator.revisionRequired > 0) {
      insights.push("Consider reviewing feedback patterns to improve future submissions");
    }
  }

  // For marketers
  if (stats.asMarketer.totalReceived > 0) {
    if (stats.asMarketer.pendingReview > 0) {
      insights.push(`You have ${stats.asMarketer.pendingReview} submissions waiting for review`);
    }
    
    if (stats.asMarketer.averageResponseTime > 0) {
      insights.push(`Your average response time: ${stats.asMarketer.averageResponseTime} hours`);
    }
  }

  // Overall insights
  if (stats.overall.totalProofs === 0) {
    insights.push("Start submitting proofs to track your progress and build your reputation");
  }

  return insights;
};

module.exports = exports;