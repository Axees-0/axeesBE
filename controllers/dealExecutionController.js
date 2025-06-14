// controllers/dealExecutionController.js
const Deal = require("../models/deal");
const User = require("../models/User");
const Earning = require("../models/earnings");
const Payout = require("../models/payouts");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { successResponse, errorResponse, handleServerError } = require("../utils/responseHelper");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/deliverables");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and videos are allowed.'));
    }
  }
});

/**
 * Submit milestone deliverables for a deal
 * PUT /api/v1/deals/:id/submit-milestone
 */
exports.submitMilestone = async (req, res) => {
  try {
    if (!req.user?.id) {
      return errorResponse(res, "Unauthorized: User not authenticated", 401);
    }

    const { id: dealId } = req.params;
    const { milestoneId, deliverables, notes } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!milestoneId) {
      return errorResponse(res, "Milestone ID is required", 400);
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
      return errorResponse(res, "Invalid milestone ID format", 400);
    }

    if (!deliverables || deliverables.length === 0) {
      return errorResponse(res, "At least one deliverable is required", 400);
    }

    // Find the deal
    const deal = await Deal.findById(dealId)
      .populate('creatorId', 'userName email')
      .populate('marketerId', 'userName email');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check if user is the creator
    if (deal.creatorId._id.toString() !== userId) {
      return errorResponse(res, "Only the creator can submit milestone deliverables", 403);
    }

    // Find the milestone
    const milestone = deal.milestones.id(milestoneId);
    if (!milestone) {
      return errorResponse(res, "Milestone not found", 404);
    }

    // Check if milestone is in a submittable state
    if (milestone.status === 'completed') {
      return errorResponse(res, "Cannot submit deliverables for completed milestone", 400);
    }

    // Check for duplicate submission
    if (milestone.status === 'submitted' || milestone.status === 'pending_review') {
      return errorResponse(res, "Milestone deliverables have already been submitted", 400);
    }

    // Validate milestone is funded
    if (milestone.status !== 'active' && milestone.status !== 'funded') {
      return errorResponse(res, "Milestone must be funded before submitting deliverables", 400);
    }

    // Update milestone with deliverables
    milestone.deliverables = deliverables.map(deliverable => ({
      _id: new mongoose.Types.ObjectId(),
      type: deliverable.type,
      url: deliverable.url,
      content: deliverable.content,
      originalName: deliverable.originalName,
      submittedAt: new Date(),
      submittedBy: userId
    }));

    milestone.status = 'submitted';
    milestone.submittedAt = new Date();
    
    if (notes) {
      milestone.feedback.push({
        _id: new mongoose.Types.ObjectId(),
        feedback: notes,
        createdAt: new Date(),
        createdBy: userId
      });
    }

    await deal.save();

    // Create notification for marketer
    await Notification.create({
      user: deal.marketerId._id,
      type: 'milestone_submitted',
      title: 'Milestone Submitted',
      subtitle: `${deal.creatorId.userName} has submitted deliverables for milestone: ${milestone.name}`,
      data: {
        dealNumber: deal.dealNumber || deal._id.toString(),
        offerName: deal.dealName,
        targetScreen: 'deal_details'
      },
      unread: true
    });

    return successResponse(res, "Milestone deliverables submitted successfully", {
      milestone: {
        id: milestone._id,
        name: milestone.name,
        status: milestone.status,
        deliverables: milestone.deliverables,
        submittedAt: milestone.submittedAt
      }
    });

  } catch (error) {
    return handleServerError(res, error, "milestone submission");
  }
};

/**
 * Approve or reject milestone submission
 * PUT /api/v1/deals/:id/approve-milestone
 */
exports.approveMilestone = async (req, res) => {
  try {
    if (!req.user?.id) {
      return errorResponse(res, "Unauthorized: User not authenticated", 401);
    }

    const { id: dealId } = req.params;
    const { milestoneId, action, feedback, rating } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!milestoneId) {
      return errorResponse(res, "Milestone ID is required", 400);
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
      return errorResponse(res, "Invalid milestone ID format", 400);
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return errorResponse(res, "Action must be either 'approve' or 'reject'", 400);
    }

    if (action === 'reject' && !feedback) {
      return errorResponse(res, "Feedback is required when rejecting milestone", 400);
    }

    // Find the deal
    const deal = await Deal.findById(dealId)
      .populate('creatorId', 'userName email')
      .populate('marketerId', 'userName email');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check if user is the marketer
    if (deal.marketerId._id.toString() !== userId) {
      return errorResponse(res, "Only the marketer can approve/reject milestone submissions", 403);
    }

    // Find the milestone
    const milestone = deal.milestones.id(milestoneId);
    if (!milestone) {
      return errorResponse(res, "Milestone not found", 404);
    }

    // Check if milestone is in reviewable state
    if (milestone.status !== 'submitted') {
      return errorResponse(res, "Can only approve/reject submitted milestones", 400);
    }

    if (action === 'approve') {
      // Approve milestone
      milestone.status = 'approved';
      milestone.completedAt = new Date();
      
      if (rating && rating >= 1 && rating <= 5) {
        milestone.rating = rating;
      }

      // Create earning record for creator
      await Earning.create({
        user: deal.creatorId._id,
        deal: deal._id,
        amount: milestone.amount,
        paymentMethod: "Milestone",
        transactionId: `milestone_${milestone._id}`,
        reference: `Milestone completion: ${milestone.name}`,
        createdAt: new Date()
      });

      // Create payout record for tracking
      await Payout.create({
        user: deal.creatorId._id,
        deal: deal._id,
        amount: milestone.amount,
        paymentMethod: "Milestone",
        stripeTransactionId: `milestone_${milestone._id}`,
        status: "COMPLETED",
        milestoneId: milestone._id,
        requestedAt: new Date()
      });

      // Add transaction record
      if (!deal.paymentInfo.transactions) {
        deal.paymentInfo.transactions = [];
      }
      
      deal.paymentInfo.transactions.push({
        paymentAmount: milestone.amount,
        paymentMethod: "Milestone",
        transactionId: `milestone_${milestone._id}`,
        status: "Completed",
        type: "milestone",
        milestoneId: milestone._id,
        paidAt: new Date()
      });

      // Notification for approval
      await Notification.create({
        user: deal.creatorId._id,
        type: 'milestone_approved',
        title: 'Milestone Approved',
        subtitle: `Your milestone "${milestone.name}" has been approved and payment released`,
        data: {
          dealNumber: deal.dealNumber || deal._id.toString(),
          offerName: deal.dealName,
          amount: milestone.amount.toString(),
          targetScreen: 'deal_details'
        },
        unread: true
      });

    } else {
      // Reject milestone
      milestone.status = 'revision_required';
      
      // Add feedback
      milestone.feedback.push({
        _id: new mongoose.Types.ObjectId(),
        feedback: feedback,
        createdAt: new Date(),
        createdBy: userId
      });

      // Notification for rejection
      await Notification.create({
        user: deal.creatorId._id,
        type: 'milestone_rejected',
        title: 'Milestone Revision Required',
        subtitle: `Your milestone "${milestone.name}" requires revisions`,
        data: {
          dealNumber: deal.dealNumber || deal._id.toString(),
          offerName: deal.dealName,
          targetScreen: 'deal_details'
        },
        unread: true
      });
    }

    await deal.save();

    return successResponse(res, `Milestone ${action === 'approve' ? 'approved' : 'rejected'} successfully`, {
      milestone: {
        id: milestone._id,
        name: milestone.name,
        status: milestone.status,
        completedAt: milestone.completedAt,
        feedback: milestone.feedback,
        rating: milestone.rating
      }
    });

  } catch (error) {
    return handleServerError(res, error, "milestone approval/rejection");
  }
};

/**
 * Complete a deal with final payment and rating
 * POST /api/v1/deals/:id/complete
 */
exports.completeDeal = async (req, res) => {
  try {
    if (!req.user?.id) {
      return errorResponse(res, "Unauthorized: User not authenticated", 401);
    }

    const { id: dealId } = req.params;
    const { rating, feedback, triggerFinalPayment = false } = req.body;
    const userId = req.user.id;

    // Find the deal
    const deal = await Deal.findById(dealId)
      .populate('creatorId', 'userName email')
      .populate('marketerId', 'userName email');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check if user is the marketer (who completes deals)
    if (deal.marketerId._id.toString() !== userId) {
      return errorResponse(res, "Only the marketer can complete deals", 403);
    }

    // Check if deal is already completed
    if (deal.status === 'completed') {
      return errorResponse(res, "Deal is already completed", 400);
    }

    // Validate that all milestones are completed
    const incompleteMilestones = deal.milestones.filter(
      milestone => milestone.status !== 'approved' && milestone.status !== 'completed'
    );

    if (incompleteMilestones.length > 0) {
      return errorResponse(res, "Cannot complete deal with incomplete milestones", 400, {
        incompleteMilestones: incompleteMilestones.map(m => ({
          id: m._id,
          name: m.name,
          status: m.status
        }))
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return errorResponse(res, "Rating must be between 1 and 5", 400);
    }

    // Update deal status
    deal.status = 'completed';
    deal.completedAt = new Date();

    // Add final feedback and rating
    if (feedback || rating) {
      if (!deal.finalReview) {
        deal.finalReview = {};
      }
      deal.finalReview.feedback = feedback;
      deal.finalReview.rating = rating;
      deal.finalReview.reviewedBy = userId;
      deal.finalReview.reviewedAt = new Date();
    }

    // Process final payment if requested and applicable
    if (triggerFinalPayment) {
      const totalMilestonePaid = deal.milestones.reduce((sum, milestone) => {
        return milestone.status === 'approved' ? sum + milestone.amount : sum;
      }, 0);

      const finalPaymentAmount = deal.paymentInfo.paymentAmount - totalMilestonePaid;

      if (finalPaymentAmount > 0) {
        // Create earning record for final payment
        await Earning.create({
          user: deal.creatorId._id,
          deal: deal._id,
          amount: finalPaymentAmount,
          paymentMethod: "Final Payment",
          transactionId: `final_payment_${deal._id}`,
          reference: "Final deal completion payment",
          createdAt: new Date()
        });

        // Add final payment transaction
        deal.paymentInfo.transactions.push({
          paymentAmount: finalPaymentAmount,
          paymentMethod: "Final Payment",
          transactionId: `final_payment_${deal._id}`,
          status: "Completed",
          type: "release_final",
          paidAt: new Date()
        });

        // Update payment status
        deal.paymentInfo.paymentStatus = "Paid";
      }
    }

    await deal.save();

    // Send completion notifications
    await Notification.create({
      user: deal.creatorId._id,
      type: 'deal_completed',
      title: 'Deal Completed',
      subtitle: `Your deal "${deal.dealName}" has been completed successfully`,
      data: {
        dealNumber: deal.dealNumber || deal._id.toString(),
        offerName: deal.dealName,
        targetScreen: 'deal_details'
      },
      unread: true
    });

    return successResponse(res, "Deal completed successfully", {
      deal: {
        id: deal._id,
        dealName: deal.dealName,
        status: deal.status,
        completedAt: deal.completedAt,
        finalReview: deal.finalReview,
        paymentStatus: deal.paymentInfo.paymentStatus
      }
    });

  } catch (error) {
    return handleServerError(res, error, "deal completion");
  }
};

/**
 * Upload files for milestone deliverables
 * POST /api/v1/deals/:id/upload-deliverable
 */
exports.uploadDeliverable = [
  upload.array('files', 10), // Allow up to 10 files
  async (req, res) => {
    try {
      if (!req.user?.id) {
        return errorResponse(res, "Unauthorized: User not authenticated", 401);
      }

      if (!req.files || req.files.length === 0) {
        return errorResponse(res, "No files uploaded", 400);
      }

      const uploadedFiles = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        url: `/uploads/deliverables/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      }));

      return successResponse(res, "Files uploaded successfully", {
        files: uploadedFiles
      });

    } catch (error) {
      return handleServerError(res, error, "file upload");
    }
  }
];

module.exports = exports;