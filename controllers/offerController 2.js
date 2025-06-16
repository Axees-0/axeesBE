const offer = require("../models/offer");
const User = require("../models/User");
const TempUser = require("../models/TempUser");
const { convertTempUserToPermanent, updateTempUserStatus } = require("./tempUserController");
const { log } = require("../utils/logger");

/**
 * Create a new offer
 */
exports.createOffer = async (req, res) => {
  try {
    const { marketerId, creatorId, ...offerData } = req.body;

    // Check if creator is a temp user
    const tempUser = await TempUser.findOne({ userName: creatorId });
    if (tempUser) {
      // Update temp user status to pending_offer
      await updateTempUserStatus(tempUser.userName, 'pending_offer');
      
      // Convert temp user to permanent user
      const conversionResult = await convertTempUserToPermanent(tempUser.userName);
      if (!conversionResult.success) {
        return res.status(400).json({ message: conversionResult.message });
      }
      
      // Use the new permanent user's ID
      creatorId = conversionResult.userId;
    }

    // Create the offer with the permanent user ID
    const newOffer = new offer({
      marketerId,
      creatorId,
      ...offerData,
      status: "pending"
    });

    await newOffer.save();

    log('info', 'Created new offer', { 
      offerId: newOffer._id,
      marketerId,
      creatorId
    });

    res.status(201).json({
      message: "Offer created successfully",
      offer: newOffer
    });
  } catch (error) {
    log('error', 'Failed to create offer', { error: error.message });
    res.status(500).json({ message: error.message });
  }
}; 