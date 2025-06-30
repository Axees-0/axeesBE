const Deal = require('../models/Deal');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { ObjectId } = require('mongodb');

/**
 * Create or send a counter offer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createCounterOffer = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { dealId, offerAmount, terms, message } = req.body;

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

    // Verify user is part of the deal
    const isCreator = deal.creatorId.toString() === userId;
    const isMarketer = deal.marketerId.toString() === userId;

    if (!isCreator && !isMarketer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to negotiate this deal'
      });
    }

    // Create counter offer
    const counterOffer = {
      id: new ObjectId(),
      userId: new ObjectId(userId),
      amount: offerAmount,
      terms: terms || {},
      message,
      createdAt: new Date(),
      status: 'pending'
    };

    // Add to negotiation history
    if (!deal.negotiationHistory) {
      deal.negotiationHistory = [];
    }
    deal.negotiationHistory.push(counterOffer);

    // Update deal status
    deal.status = 'negotiating';
    deal.lastNegotiationAt = new Date();

    await deal.save();

    // Send notification to the other party
    const otherUserId = isCreator ? deal.marketerId : deal.creatorId;
    await Notification.create({
      userId: otherUserId,
      type: 'counter_offer',
      title: 'New Counter Offer',
      message: `${isCreator ? 'Creator' : 'Marketer'} sent a counter offer for your deal`,
      data: {
        dealId: deal._id,
        counterOfferId: counterOffer.id,
        amount: offerAmount
      }
    });

    res.status(201).json({
      success: true,
      message: 'Counter offer sent successfully',
      data: {
        deal,
        counterOffer
      }
    });

  } catch (error) {
    console.error('Error creating counter offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create counter offer',
      error: error.message
    });
  }
};

/**
 * Accept a counter offer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.acceptCounterOffer = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { dealId, counterOfferId } = req.body;

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

    // Find the counter offer
    const counterOffer = deal.negotiationHistory?.find(
      offer => offer.id.toString() === counterOfferId
    );

    if (!counterOffer) {
      return res.status(404).json({
        success: false,
        message: 'Counter offer not found'
      });
    }

    // Verify user is authorized to accept
    const isCreator = deal.creatorId.toString() === userId;
    const isMarketer = deal.marketerId.toString() === userId;

    if (!isCreator && !isMarketer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this offer'
      });
    }

    // Update counter offer status
    counterOffer.status = 'accepted';
    counterOffer.acceptedAt = new Date();

    // Update deal with new terms
    deal.amount = counterOffer.amount;
    deal.terms = { ...deal.terms, ...counterOffer.terms };
    deal.status = 'active';
    deal.acceptedAt = new Date();

    await deal.save();

    // Send notification to the offer creator
    const offerCreatorId = counterOffer.userId;
    await Notification.create({
      userId: offerCreatorId,
      type: 'offer_accepted',
      title: 'Counter Offer Accepted',
      message: 'Your counter offer has been accepted',
      data: {
        dealId: deal._id,
        counterOfferId: counterOffer.id,
        amount: counterOffer.amount
      }
    });

    res.status(200).json({
      success: true,
      message: 'Counter offer accepted successfully',
      data: { deal }
    });

  } catch (error) {
    console.error('Error accepting counter offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept counter offer',
      error: error.message
    });
  }
};

/**
 * Reject a counter offer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.rejectCounterOffer = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { dealId, counterOfferId, reason } = req.body;

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

    // Find the counter offer
    const counterOffer = deal.negotiationHistory?.find(
      offer => offer.id.toString() === counterOfferId
    );

    if (!counterOffer) {
      return res.status(404).json({
        success: false,
        message: 'Counter offer not found'
      });
    }

    // Verify user is authorized to reject
    const isCreator = deal.creatorId.toString() === userId;
    const isMarketer = deal.marketerId.toString() === userId;

    if (!isCreator && !isMarketer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this offer'
      });
    }

    // Update counter offer status
    counterOffer.status = 'rejected';
    counterOffer.rejectedAt = new Date();
    counterOffer.rejectionReason = reason;

    await deal.save();

    // Send notification to the offer creator
    const offerCreatorId = counterOffer.userId;
    await Notification.create({
      userId: offerCreatorId,
      type: 'offer_rejected',
      title: 'Counter Offer Rejected',
      message: 'Your counter offer has been rejected',
      data: {
        dealId: deal._id,
        counterOfferId: counterOffer.id,
        reason
      }
    });

    res.status(200).json({
      success: true,
      message: 'Counter offer rejected successfully',
      data: { deal }
    });

  } catch (error) {
    console.error('Error rejecting counter offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject counter offer',
      error: error.message
    });
  }
};

/**
 * Accept a counter offer by counter offer ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.acceptCounterOfferById = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { counterOfferId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Find the deal with this counter offer
    const deal = await Deal.findOne({
      'negotiationHistory.id': new ObjectId(counterOfferId)
    });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Counter offer not found'
      });
    }

    // Find the specific counter offer
    const counterOffer = deal.negotiationHistory.find(
      offer => offer.id.toString() === counterOfferId
    );

    // Verify user is authorized to accept
    const isCreator = deal.creatorId.toString() === userId;
    const isMarketer = deal.marketerId.toString() === userId;

    if (!isCreator && !isMarketer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this offer'
      });
    }

    // Update counter offer status
    counterOffer.status = 'accepted';
    counterOffer.acceptedAt = new Date();

    // Update deal with new terms
    deal.amount = counterOffer.amount;
    deal.terms = { ...deal.terms, ...counterOffer.terms };
    deal.status = 'active';
    deal.acceptedAt = new Date();

    await deal.save();

    // Send notification to the offer creator
    const offerCreatorId = counterOffer.userId;
    await Notification.create({
      userId: offerCreatorId,
      type: 'offer_accepted',
      title: 'Counter Offer Accepted',
      message: 'Your counter offer has been accepted',
      data: {
        dealId: deal._id,
        counterOfferId: counterOffer.id,
        amount: counterOffer.amount
      }
    });

    res.status(200).json({
      success: true,
      message: 'Counter offer accepted successfully',
      data: { 
        deal,
        dealId: deal._id
      }
    });

  } catch (error) {
    console.error('Error accepting counter offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept counter offer',
      error: error.message
    });
  }
};

/**
 * Reject a counter offer by counter offer ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.rejectCounterOfferById = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { counterOfferId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Find the deal with this counter offer
    const deal = await Deal.findOne({
      'negotiationHistory.id': new ObjectId(counterOfferId)
    });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Counter offer not found'
      });
    }

    // Find the specific counter offer
    const counterOffer = deal.negotiationHistory.find(
      offer => offer.id.toString() === counterOfferId
    );

    // Verify user is authorized to reject
    const isCreator = deal.creatorId.toString() === userId;
    const isMarketer = deal.marketerId.toString() === userId;

    if (!isCreator && !isMarketer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this offer'
      });
    }

    // Update counter offer status
    counterOffer.status = 'rejected';
    counterOffer.rejectedAt = new Date();
    counterOffer.rejectionReason = reason;

    await deal.save();

    // Send notification to the offer creator
    const offerCreatorId = counterOffer.userId;
    await Notification.create({
      userId: offerCreatorId,
      type: 'offer_rejected',
      title: 'Counter Offer Rejected',
      message: 'Your counter offer has been rejected',
      data: {
        dealId: deal._id,
        counterOfferId: counterOffer.id,
        reason
      }
    });

    res.status(200).json({
      success: true,
      message: 'Counter offer rejected successfully',
      data: { deal }
    });

  } catch (error) {
    console.error('Error rejecting counter offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject counter offer',
      error: error.message
    });
  }
};

/**
 * Get a specific counter offer by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCounterOfferById = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { counterOfferId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Find the deal with this counter offer
    const deal = await Deal.findOne({
      'negotiationHistory.id': new ObjectId(counterOfferId)
    }).populate('creatorId', 'name username profilePicture')
      .populate('marketerId', 'name username profilePicture');

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Counter offer not found'
      });
    }

    // Verify user is part of the deal
    const isCreator = deal.creatorId._id.toString() === userId;
    const isMarketer = deal.marketerId._id.toString() === userId;

    if (!isCreator && !isMarketer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this counter offer'
      });
    }

    // Find the specific counter offer
    const counterOffer = deal.negotiationHistory.find(
      offer => offer.id.toString() === counterOfferId
    );

    if (!counterOffer) {
      return res.status(404).json({
        success: false,
        message: 'Counter offer not found'
      });
    }

    // Get the user who made the counter offer
    const offerUser = await User.findById(counterOffer.userId, 'name username profilePicture');

    res.status(200).json({
      success: true,
      data: {
        id: counterOffer.id,
        dealId: deal._id,
        dealTitle: deal.title,
        offerAmount: counterOffer.amount,
        terms: counterOffer.terms,
        message: counterOffer.message,
        status: counterOffer.status,
        createdAt: counterOffer.createdAt,
        creator: {
          id: deal.creatorId._id,
          name: deal.creatorId.name,
          handle: `@${deal.creatorId.username}`,
        },
        marketer: {
          id: deal.marketerId._id,
          name: deal.marketerId.name,
          company: deal.marketerId.company || 'Company',
        },
        user: offerUser,
        originalAmount: deal.originalAmount || deal.amount
      }
    });

  } catch (error) {
    console.error('Error getting counter offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get counter offer',
      error: error.message
    });
  }
};

/**
 * Get latest counter offer for a deal
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getLatestCounterOffer = async (req, res) => {
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
      .populate('creatorId', 'name username profilePicture')
      .populate('marketerId', 'name username profilePicture');

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

    // Get the latest counter offer
    const negotiationHistory = deal.negotiationHistory || [];
    if (negotiationHistory.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No counter offers found for this deal'
      });
    }

    const latestCounterOffer = negotiationHistory
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    // Get the user who made the counter offer
    const offerUser = await User.findById(latestCounterOffer.userId, 'name username profilePicture');

    res.status(200).json({
      success: true,
      data: {
        id: latestCounterOffer.id,
        dealId: deal._id,
        dealTitle: deal.title,
        offerAmount: latestCounterOffer.amount,
        terms: latestCounterOffer.terms,
        message: latestCounterOffer.message,
        status: latestCounterOffer.status,
        createdAt: latestCounterOffer.createdAt,
        creator: {
          id: deal.creatorId._id,
          name: deal.creatorId.name,
          handle: `@${deal.creatorId.username}`,
        },
        marketer: {
          id: deal.marketerId._id,
          name: deal.marketerId.name,
          company: deal.marketerId.company || 'Company',
        },
        user: offerUser,
        originalAmount: deal.originalAmount || deal.amount
      }
    });

  } catch (error) {
    console.error('Error getting latest counter offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get latest counter offer',
      error: error.message
    });
  }
};

/**
 * Get negotiation history for a deal
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getNegotiationHistory = async (req, res) => {
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
      .populate('creatorId', 'name username profilePicture')
      .populate('marketerId', 'name username profilePicture');

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
        message: 'Not authorized to view this negotiation'
      });
    }

    // Get negotiation history with user details
    const negotiationHistory = await Promise.all(
      (deal.negotiationHistory || []).map(async (offer) => {
        const user = await User.findById(offer.userId, 'name username profilePicture userType');
        return {
          id: offer.id,
          type: 'counter_offer',
          amount: offer.amount,
          terms: offer.terms,
          message: offer.message,
          createdAt: offer.createdAt,
          status: offer.status,
          user: {
            id: user._id,
            name: user.name,
            userType: user.userType || (deal.creatorId._id.toString() === user._id.toString() ? 'creator' : 'marketer')
          }
        };
      })
    );

    // Format the response for the negotiation history page
    const formattedData = {
      dealId: deal._id,
      dealTitle: deal.title,
      creator: {
        id: deal.creatorId._id,
        name: deal.creatorId.name,
        handle: `@${deal.creatorId.username}`,
      },
      marketer: {
        id: deal.marketerId._id,
        name: deal.marketerId.name,
        company: deal.marketerId.company || 'Company',
      },
      currentStatus: deal.status === 'active' ? 'accepted' : deal.status === 'cancelled' ? 'cancelled' : 'negotiating',
      finalAmount: deal.status === 'active' ? deal.amount : null,
      events: negotiationHistory.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    };

    res.status(200).json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error getting negotiation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get negotiation history',
      error: error.message
    });
  }
};