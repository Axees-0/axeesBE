const User = require('../models/User');
const PaymentMethod = require('../models/PaymentMethod');
const PaymentIntent = require('../models/PaymentIntent');
const { ObjectId } = require('mongodb');

/**
 * Save payment method for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.savePaymentMethod = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { 
      type, 
      cardDetails, 
      bankDetails, 
      digitalWallet, 
      isDefault = false,
      billingAddress 
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!type || !['card', 'bank', 'digital_wallet'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment method type is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If setting as default, update existing default
    if (isDefault) {
      await PaymentMethod.updateMany(
        { userId: new ObjectId(userId), isDefault: true },
        { isDefault: false }
      );
    }

    // Create payment method
    const paymentMethod = new PaymentMethod({
      userId: new ObjectId(userId),
      type,
      cardDetails: type === 'card' ? cardDetails : undefined,
      bankDetails: type === 'bank' ? bankDetails : undefined,
      digitalWallet: type === 'digital_wallet' ? digitalWallet : undefined,
      billingAddress,
      isDefault,
      isActive: true,
      createdAt: new Date()
    });

    await paymentMethod.save();

    // Update user's payment methods array
    if (!user.paymentMethods) {
      user.paymentMethods = [];
    }
    user.paymentMethods.push(paymentMethod._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Payment method saved successfully',
      data: {
        paymentMethod: {
          id: paymentMethod._id,
          type: paymentMethod.type,
          isDefault: paymentMethod.isDefault,
          isActive: paymentMethod.isActive,
          // Return masked details for security
          maskedDetails: getMaskedPaymentDetails(paymentMethod),
          createdAt: paymentMethod.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error saving payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save payment method',
      error: error.message
    });
  }
};

/**
 * Get all saved payment methods for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const paymentMethods = await PaymentMethod.find({
      userId: new ObjectId(userId),
      isActive: true
    }).sort({ isDefault: -1, createdAt: -1 });

    // Return masked payment method details
    const maskedMethods = paymentMethods.map(method => ({
      id: method._id,
      type: method.type,
      isDefault: method.isDefault,
      isActive: method.isActive,
      maskedDetails: getMaskedPaymentDetails(method),
      createdAt: method.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        paymentMethods: maskedMethods,
        total: maskedMethods.length,
        hasDefault: maskedMethods.some(method => method.isDefault)
      }
    });

  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods',
      error: error.message
    });
  }
};

/**
 * Update payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updatePaymentMethod = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { paymentMethodId } = req.params;
    const { isDefault, billingAddress, nickname } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      userId: new ObjectId(userId),
      isActive: true
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // If setting as default, update existing default
    if (isDefault && !paymentMethod.isDefault) {
      await PaymentMethod.updateMany(
        { userId: new ObjectId(userId), isDefault: true },
        { isDefault: false }
      );
      paymentMethod.isDefault = true;
    }

    // Update other fields
    if (billingAddress) paymentMethod.billingAddress = billingAddress;
    if (nickname) paymentMethod.nickname = nickname;
    
    paymentMethod.updatedAt = new Date();
    await paymentMethod.save();

    res.status(200).json({
      success: true,
      message: 'Payment method updated successfully',
      data: {
        paymentMethod: {
          id: paymentMethod._id,
          type: paymentMethod.type,
          isDefault: paymentMethod.isDefault,
          nickname: paymentMethod.nickname,
          maskedDetails: getMaskedPaymentDetails(paymentMethod),
          updatedAt: paymentMethod.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment method',
      error: error.message
    });
  }
};

/**
 * Delete payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { paymentMethodId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      userId: new ObjectId(userId)
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Soft delete - mark as inactive
    paymentMethod.isActive = false;
    paymentMethod.deletedAt = new Date();
    await paymentMethod.save();

    // Remove from user's payment methods array
    await User.updateOne(
      { _id: userId },
      { $pull: { paymentMethods: paymentMethodId } }
    );

    // If this was the default, set another as default
    if (paymentMethod.isDefault) {
      const nextMethod = await PaymentMethod.findOne({
        userId: new ObjectId(userId),
        isActive: true,
        _id: { $ne: paymentMethodId }
      });
      
      if (nextMethod) {
        nextMethod.isDefault = true;
        await nextMethod.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method',
      error: error.message
    });
  }
};

/**
 * Save payment intent for later completion
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.savePaymentIntent = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { 
      amount, 
      currency, 
      purpose, 
      metadata, 
      expiresAt,
      paymentMethodId 
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!amount || !currency || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Amount, currency, and purpose are required'
      });
    }

    // Create payment intent
    const paymentIntent = new PaymentIntent({
      userId: new ObjectId(userId),
      amount,
      currency,
      purpose,
      status: 'pending',
      paymentMethodId: paymentMethodId ? new ObjectId(paymentMethodId) : undefined,
      metadata: metadata || {},
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
      createdAt: new Date()
    });

    await paymentIntent.save();

    res.status(201).json({
      success: true,
      message: 'Payment intent saved successfully',
      data: {
        paymentIntent: {
          id: paymentIntent._id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          purpose: paymentIntent.purpose,
          status: paymentIntent.status,
          expiresAt: paymentIntent.expiresAt,
          createdAt: paymentIntent.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error saving payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save payment intent',
      error: error.message
    });
  }
};

/**
 * Get saved payment intents for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPaymentIntents = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { status, purpose } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const filter = {
      userId: new ObjectId(userId),
      expiresAt: { $gt: new Date() } // Only non-expired intents
    };

    if (status) filter.status = status;
    if (purpose) filter.purpose = purpose;

    const paymentIntents = await PaymentIntent.find(filter)
      .populate('paymentMethodId', 'type isDefault')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        paymentIntents: paymentIntents.map(intent => ({
          id: intent._id,
          amount: intent.amount,
          currency: intent.currency,
          purpose: intent.purpose,
          status: intent.status,
          paymentMethod: intent.paymentMethodId,
          metadata: intent.metadata,
          expiresAt: intent.expiresAt,
          createdAt: intent.createdAt
        })),
        total: paymentIntents.length
      }
    });

  } catch (error) {
    console.error('Error getting payment intents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment intents',
      error: error.message
    });
  }
};

/**
 * Helper function to get masked payment details
 * @param {Object} paymentMethod - Payment method object
 * @returns {Object} Masked payment details
 */
function getMaskedPaymentDetails(paymentMethod) {
  switch (paymentMethod.type) {
    case 'card':
      return {
        type: 'card',
        brand: paymentMethod.cardDetails?.brand,
        last4: paymentMethod.cardDetails?.last4,
        expiryMonth: paymentMethod.cardDetails?.expiryMonth,
        expiryYear: paymentMethod.cardDetails?.expiryYear
      };
    case 'bank':
      return {
        type: 'bank',
        bankName: paymentMethod.bankDetails?.bankName,
        accountLast4: paymentMethod.bankDetails?.accountNumber?.slice(-4),
        accountType: paymentMethod.bankDetails?.accountType
      };
    case 'digital_wallet':
      return {
        type: 'digital_wallet',
        provider: paymentMethod.digitalWallet?.provider,
        email: paymentMethod.digitalWallet?.email
      };
    default:
      return {
        type: paymentMethod.type
      };
  }
}