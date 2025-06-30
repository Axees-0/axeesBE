const Deal = require('../models/Deal');
const Milestone = require('../models/Milestone');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { ObjectId } = require('mongodb');

/**
 * Create milestone payment structure for a deal
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createMilestonePayments = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { dealId, milestones } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!dealId || !milestones || !Array.isArray(milestones)) {
      return res.status(400).json({
        success: false,
        message: 'Deal ID and milestones array are required'
      });
    }

    // Find and validate the deal
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Verify user is part of the deal
    const isCreator = deal.creatorId.toString() === userId;
    const isMarketer = deal.marketerId.toString() === userId;

    if (!isCreator && !isMarketer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this deal'
      });
    }

    // Validate milestone structure
    let totalPercentage = 0;
    const milestonePayments = [];

    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];
      
      if (!milestone.title || !milestone.percentage || !milestone.description) {
        return res.status(400).json({
          success: false,
          message: `Milestone ${i + 1} is missing required fields (title, percentage, description)`
        });
      }

      if (milestone.percentage <= 0 || milestone.percentage > 100) {
        return res.status(400).json({
          success: false,
          message: `Milestone ${i + 1} percentage must be between 1 and 100`
        });
      }

      totalPercentage += milestone.percentage;

      const milestonePayment = {
        id: new ObjectId(),
        title: milestone.title,
        description: milestone.description,
        percentage: milestone.percentage,
        amount: (deal.amount * milestone.percentage) / 100,
        order: i + 1,
        status: 'pending',
        dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
        requirements: milestone.requirements || [],
        createdAt: new Date()
      };

      milestonePayments.push(milestonePayment);
    }

    // Verify total percentage equals 100%
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Total milestone percentages must equal 100% (current: ${totalPercentage}%)`
      });
    }

    // Update deal with milestone payment structure
    deal.milestonePayments = milestonePayments;
    deal.paymentStructure = 'milestone';
    deal.updatedAt = new Date();

    await deal.save();

    // Send notification to other party
    const otherUserId = isCreator ? deal.marketerId : deal.creatorId;
    await Notification.create({
      userId: otherUserId,
      type: 'milestone_structure_created',
      title: 'Milestone Payments Created',
      message: `${isCreator ? 'Creator' : 'Marketer'} has set up milestone payments for your deal`,
      data: {
        dealId: deal._id,
        milestonesCount: milestonePayments.length,
        totalAmount: deal.amount
      }
    });

    res.status(201).json({
      success: true,
      message: 'Milestone payment structure created successfully',
      data: {
        dealId: deal._id,
        milestonePayments,
        totalAmount: deal.amount,
        paymentStructure: 'milestone'
      }
    });

  } catch (error) {
    console.error('Error creating milestone payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create milestone payments',
      error: error.message
    });
  }
};

/**
 * Complete a milestone and trigger payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.completeMilestone = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { dealId, milestoneId, proofOfCompletion, notes } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!dealId || !milestoneId) {
      return res.status(400).json({
        success: false,
        message: 'Deal ID and milestone ID are required'
      });
    }

    // Find the deal
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Find the milestone
    const milestone = deal.milestonePayments?.find(
      m => m.id.toString() === milestoneId
    );

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    // Verify user is the marketer (usually marketer completes milestones)
    if (deal.marketerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the marketer can complete milestones'
      });
    }

    // Check if milestone is already completed
    if (milestone.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Milestone is already completed'
      });
    }

    // Check if previous milestones are completed (in order)
    const currentOrder = milestone.order;
    const previousMilestone = deal.milestonePayments?.find(
      m => m.order === currentOrder - 1
    );

    if (previousMilestone && previousMilestone.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Previous milestones must be completed first'
      });
    }

    // Update milestone status
    milestone.status = 'completed';
    milestone.completedAt = new Date();
    milestone.proofOfCompletion = proofOfCompletion;
    milestone.completionNotes = notes;

    // Auto-release payment if enabled
    const shouldAutoRelease = deal.autoReleasePayments !== false; // default true
    
    if (shouldAutoRelease) {
      milestone.paymentStatus = 'released';
      milestone.paymentReleasedAt = new Date();

      // Create payment record
      const payment = new Payment({
        dealId: deal._id,
        milestoneId: milestone.id,
        fromUserId: deal.creatorId,
        toUserId: deal.marketerId,
        amount: milestone.amount,
        type: 'milestone_payment',
        status: 'completed',
        description: `Milestone payment: ${milestone.title}`,
        metadata: {
          milestoneOrder: milestone.order,
          totalMilestones: deal.milestonePayments.length
        },
        createdAt: new Date()
      });

      await payment.save();

      // Update user earnings
      await User.updateOne(
        { _id: deal.marketerId },
        { 
          $inc: { 
            'earnings.total': milestone.amount,
            'earnings.milestone': milestone.amount 
          }
        }
      );
    } else {
      milestone.paymentStatus = 'pending_approval';
    }

    await deal.save();

    // Send notification to creator
    await Notification.create({
      userId: deal.creatorId,
      type: 'milestone_completed',
      title: 'Milestone Completed',
      message: `Milestone "${milestone.title}" has been completed`,
      data: {
        dealId: deal._id,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        amount: milestone.amount,
        autoReleased: shouldAutoRelease
      }
    });

    res.status(200).json({
      success: true,
      message: 'Milestone completed successfully',
      data: {
        milestone,
        paymentReleased: shouldAutoRelease,
        nextMilestone: deal.milestonePayments?.find(
          m => m.order === currentOrder + 1 && m.status === 'pending'
        )
      }
    });

  } catch (error) {
    console.error('Error completing milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete milestone',
      error: error.message
    });
  }
};

/**
 * Approve milestone payment (by creator)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.approveMilestonePayment = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { dealId, milestoneId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Find the deal
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Verify user is the creator
    if (deal.creatorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can approve milestone payments'
      });
    }

    // Find the milestone
    const milestone = deal.milestonePayments?.find(
      m => m.id.toString() === milestoneId
    );

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    if (milestone.paymentStatus !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Milestone payment is not pending approval'
      });
    }

    // Release payment
    milestone.paymentStatus = 'released';
    milestone.paymentReleasedAt = new Date();

    // Create payment record
    const payment = new Payment({
      dealId: deal._id,
      milestoneId: milestone.id,
      fromUserId: deal.creatorId,
      toUserId: deal.marketerId,
      amount: milestone.amount,
      type: 'milestone_payment',
      status: 'completed',
      description: `Approved milestone payment: ${milestone.title}`,
      metadata: {
        milestoneOrder: milestone.order,
        totalMilestones: deal.milestonePayments.length,
        manuallyApproved: true
      },
      createdAt: new Date()
    });

    await payment.save();

    // Update user earnings
    await User.updateOne(
      { _id: deal.marketerId },
      { 
        $inc: { 
          'earnings.total': milestone.amount,
          'earnings.milestone': milestone.amount 
        }
      }
    );

    await deal.save();

    // Send notification to marketer
    await Notification.create({
      userId: deal.marketerId,
      type: 'milestone_payment_approved',
      title: 'Milestone Payment Approved',
      message: `Payment for milestone "${milestone.title}" has been approved and released`,
      data: {
        dealId: deal._id,
        milestoneId: milestone.id,
        amount: milestone.amount
      }
    });

    res.status(200).json({
      success: true,
      message: 'Milestone payment approved and released',
      data: {
        milestone,
        payment: {
          id: payment._id,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error approving milestone payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve milestone payment',
      error: error.message
    });
  }
};

/**
 * Get milestone payment status for a deal
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMilestoneStatus = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { dealId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Find the deal
    const deal = await Deal.findById(dealId)
      .populate('creatorId', 'name username')
      .populate('marketerId', 'name username');

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Verify user is part of the deal
    const isCreator = deal.creatorId._id.toString() === userId;
    const isMarketer = deal.marketerId._id.toString() === userId;

    if (!isCreator && !isMarketer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this deal'
      });
    }

    // Calculate progress
    const milestones = deal.milestonePayments || [];
    const completedMilestones = milestones.filter(m => m.status === 'completed');
    const releasedPayments = milestones.filter(m => m.paymentStatus === 'released');
    const totalProgress = (completedMilestones.length / milestones.length) * 100;
    const totalReleased = releasedPayments.reduce((sum, m) => sum + m.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        deal: {
          id: deal._id,
          title: deal.title,
          amount: deal.amount,
          status: deal.status,
          creator: deal.creatorId,
          marketer: deal.marketerId
        },
        milestones: milestones.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          percentage: m.percentage,
          amount: m.amount,
          order: m.order,
          status: m.status,
          paymentStatus: m.paymentStatus,
          dueDate: m.dueDate,
          completedAt: m.completedAt,
          paymentReleasedAt: m.paymentReleasedAt,
          requirements: m.requirements
        })),
        progress: {
          completedMilestones: completedMilestones.length,
          totalMilestones: milestones.length,
          progressPercentage: Math.round(totalProgress),
          totalReleased,
          pendingRelease: milestones
            .filter(m => m.paymentStatus === 'pending_approval')
            .reduce((sum, m) => sum + m.amount, 0)
        },
        userRole: isCreator ? 'creator' : 'marketer'
      }
    });

  } catch (error) {
    console.error('Error getting milestone status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get milestone status',
      error: error.message
    });
  }
};