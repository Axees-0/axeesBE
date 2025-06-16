const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
const { successResponse, errorResponse, handleServerError } = require("../utils/responseHelper");
const crypto = require('crypto');

/**
 * Enhanced Payment Persistence Controller
 * Provides comprehensive payment method storage, retrieval, and management
 */

// Encrypt sensitive data before storage
const encrypt = (text) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.PAYMENT_ENCRYPTION_KEY || 'default-key-32-characters-long!!', 'utf8');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    authTag: authTag.toString('hex'),
    iv: iv.toString('hex')
  };
};

// Decrypt sensitive data
const decrypt = (encryptedData) => {
  try {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.PAYMENT_ENCRYPTION_KEY || 'default-key-32-characters-long!!', 'utf8');
    
    const decipher = crypto.createDecipheriv(
      algorithm, 
      key, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Add and persist payment method with enhanced security
exports.addAndPersistPaymentMethod = async (req, res) => {
  try {
    const {
      paymentMethodId,
      type = 'card', // card, bank_account, debit_card
      isDefault = false,
      nickname, // User-friendly name for the payment method
      billingDetails
    } = req.body;

    if (!paymentMethodId) {
      return errorResponse(res, "Payment method ID is required", 400);
    }

    const user = await User.findById(req.user.id).select(
      "+stripeCustomerId +stripeConnectId +paymentMethods +email +name"
    );

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Ensure Stripe Customer exists
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.userName || "Axees user",
        metadata: {
          userId: user._id.toString(),
          userType: user.userType
        }
      });
      user.stripeCustomerId = customer.id;
    }

    let paymentMethodDetails;
    let stripeId;

    // Handle different payment method types
    if (type === 'bank_account' || type === 'debit_card') {
      // For payouts - attach to Connect account
      if (!user.stripeConnectId) {
        return errorResponse(res, "Stripe Connect account required for payout methods", 400);
      }

      const externalAccount = await stripe.accounts.createExternalAccount(
        user.stripeConnectId,
        { external_account: paymentMethodId }
      );

      stripeId = externalAccount.id;
      paymentMethodDetails = {
        type: externalAccount.object,
        last4: externalAccount.last4,
        bankName: externalAccount.bank_name,
        currency: externalAccount.currency,
        routingNumber: externalAccount.routing_number ? 
          encrypt(externalAccount.routing_number) : null
      };

    } else {
      // For charges - attach to Customer
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId
      });

      stripeId = paymentMethod.id;

      // Set as default if requested
      if (isDefault) {
        await stripe.customers.update(user.stripeCustomerId, {
          invoice_settings: { default_payment_method: paymentMethod.id }
        });
      }

      paymentMethodDetails = {
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
          fingerprint: paymentMethod.card.fingerprint,
          funding: paymentMethod.card.funding
        } : null,
        billingDetails: paymentMethod.billing_details
      };
    }

    // Initialize payment methods array if not exists
    if (!user.paymentMethods) {
      user.paymentMethods = [];
    }

    // Check if payment method already exists
    const existingMethodIndex = user.paymentMethods.findIndex(m => m.id === stripeId);
    
    if (existingMethodIndex > -1) {
      // Update existing method
      user.paymentMethods[existingMethodIndex] = {
        ...user.paymentMethods[existingMethodIndex],
        nickname: nickname || user.paymentMethods[existingMethodIndex].nickname,
        isDefault: isDefault || user.paymentMethods[existingMethodIndex].isDefault,
        lastUsed: new Date(),
        metadata: {
          ...user.paymentMethods[existingMethodIndex].metadata,
          ...paymentMethodDetails
        }
      };
    } else {
      // Add new payment method
      const newPaymentMethod = {
        id: stripeId,
        type,
        nickname: nickname || `${type === 'card' ? 'Card' : 'Account'} ending in ${paymentMethodDetails.last4 || 'xxxx'}`,
        isDefault: isDefault || user.paymentMethods.length === 0,
        isBankAccount: type === 'bank_account',
        isPayoutCard: type === 'debit_card',
        addedAt: new Date(),
        lastUsed: new Date(),
        metadata: paymentMethodDetails,
        status: 'active'
      };

      // If setting as default, unset other defaults
      if (newPaymentMethod.isDefault) {
        user.paymentMethods.forEach(pm => {
          pm.isDefault = false;
        });
      }

      user.paymentMethods.push(newPaymentMethod);
    }

    // Save encrypted billing details if provided
    if (billingDetails) {
      user.billingDetails = {
        ...user.billingDetails,
        ...billingDetails,
        lastUpdated: new Date()
      };
    }

    await user.save();

    // Log payment method addition for audit
    console.log(`Payment method added for user ${user._id}: ${stripeId}`);

    return successResponse(res, "Payment method added and persisted successfully", {
      paymentMethodId: stripeId,
      type,
      nickname: nickname || `${type} ending in ${paymentMethodDetails.last4 || 'xxxx'}`,
      isDefault: isDefault || user.paymentMethods.length === 1,
      last4: paymentMethodDetails.last4,
      brand: paymentMethodDetails.card?.brand
    });

  } catch (error) {
    console.error("Error adding payment method:", error);
    return handleServerError(res, error);
  }
};

// Get all persisted payment methods for a user
exports.getPersistedPaymentMethods = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    const user = await User.findById(req.user.id)
      .select("+stripeCustomerId +stripeConnectId +paymentMethods");

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    let paymentMethods = user.paymentMethods || [];

    // Filter out inactive methods unless requested
    if (!includeInactive) {
      paymentMethods = paymentMethods.filter(pm => pm.status === 'active');
    }

    // Sync with Stripe to ensure accuracy
    const syncedMethods = await syncPaymentMethodsWithStripe(user, paymentMethods);

    // Format for response
    const formattedMethods = syncedMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      nickname: pm.nickname,
      isDefault: pm.isDefault,
      last4: pm.metadata?.last4 || pm.metadata?.card?.last4,
      brand: pm.metadata?.card?.brand,
      bankName: pm.metadata?.bankName,
      expMonth: pm.metadata?.card?.expMonth,
      expYear: pm.metadata?.card?.expYear,
      addedAt: pm.addedAt,
      lastUsed: pm.lastUsed,
      status: pm.status,
      canCharge: pm.type === 'card' && !pm.isBankAccount && !pm.isPayoutCard,
      canPayout: pm.isBankAccount || pm.isPayoutCard
    }));

    return successResponse(res, "Payment methods retrieved successfully", {
      paymentMethods: formattedMethods,
      defaultMethodId: formattedMethods.find(m => m.isDefault)?.id,
      hasPayoutMethod: formattedMethods.some(m => m.canPayout),
      hasChargeMethod: formattedMethods.some(m => m.canCharge)
    });

  } catch (error) {
    console.error("Error retrieving payment methods:", error);
    return handleServerError(res, error);
  }
};

// Update payment method (nickname, default status)
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const { nickname, isDefault, status } = req.body;

    const user = await User.findById(req.user.id).select("+paymentMethods");

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const methodIndex = user.paymentMethods.findIndex(pm => pm.id === paymentMethodId);

    if (methodIndex === -1) {
      return errorResponse(res, "Payment method not found", 404);
    }

    // Update fields
    if (nickname !== undefined) {
      user.paymentMethods[methodIndex].nickname = nickname;
    }

    if (status !== undefined && ['active', 'inactive'].includes(status)) {
      user.paymentMethods[methodIndex].status = status;
    }

    if (isDefault === true) {
      // Unset other defaults
      user.paymentMethods.forEach((pm, index) => {
        pm.isDefault = index === methodIndex;
      });

      // Update Stripe default if it's a charge method
      if (!user.paymentMethods[methodIndex].isBankAccount && 
          !user.paymentMethods[methodIndex].isPayoutCard &&
          user.stripeCustomerId) {
        await stripe.customers.update(user.stripeCustomerId, {
          invoice_settings: { default_payment_method: paymentMethodId }
        });
      }
    }

    user.paymentMethods[methodIndex].lastUpdated = new Date();
    await user.save();

    return successResponse(res, "Payment method updated successfully", {
      paymentMethod: user.paymentMethods[methodIndex]
    });

  } catch (error) {
    console.error("Error updating payment method:", error);
    return handleServerError(res, error);
  }
};

// Remove payment method
exports.removePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const { force = false } = req.body;

    const user = await User.findById(req.user.id)
      .select("+stripeCustomerId +stripeConnectId +paymentMethods");

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const methodIndex = user.paymentMethods.findIndex(pm => pm.id === paymentMethodId);

    if (methodIndex === -1) {
      return errorResponse(res, "Payment method not found", 404);
    }

    const paymentMethod = user.paymentMethods[methodIndex];

    // Check if it's the only payment method
    if (user.paymentMethods.length === 1 && !force) {
      return errorResponse(res, "Cannot remove the only payment method. Add another method first.", 400);
    }

    // Remove from Stripe
    try {
      if (paymentMethod.isBankAccount || paymentMethod.isPayoutCard) {
        // Remove from Connect account
        if (user.stripeConnectId) {
          await stripe.accounts.deleteExternalAccount(
            user.stripeConnectId,
            paymentMethodId
          );
        }
      } else {
        // Detach from Customer
        await stripe.paymentMethods.detach(paymentMethodId);
      }
    } catch (stripeError) {
      console.error("Stripe removal error:", stripeError);
      // Continue with local removal even if Stripe fails
    }

    // Remove from user's payment methods
    user.paymentMethods.splice(methodIndex, 1);

    // If removed method was default, set another as default
    if (paymentMethod.isDefault && user.paymentMethods.length > 0) {
      user.paymentMethods[0].isDefault = true;
      
      // Update Stripe default
      if (!user.paymentMethods[0].isBankAccount && 
          !user.paymentMethods[0].isPayoutCard &&
          user.stripeCustomerId) {
        await stripe.customers.update(user.stripeCustomerId, {
          invoice_settings: { default_payment_method: user.paymentMethods[0].id }
        });
      }
    }

    await user.save();

    return successResponse(res, "Payment method removed successfully", {
      removedMethodId: paymentMethodId,
      remainingMethods: user.paymentMethods.length
    });

  } catch (error) {
    console.error("Error removing payment method:", error);
    return handleServerError(res, error);
  }
};

// Verify payment method is still valid
exports.verifyPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    const user = await User.findById(req.user.id)
      .select("+stripeCustomerId +stripeConnectId +paymentMethods");

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const localMethod = user.paymentMethods.find(pm => pm.id === paymentMethodId);

    if (!localMethod) {
      return errorResponse(res, "Payment method not found locally", 404);
    }

    let isValid = false;
    let stripeStatus = null;
    let message = '';

    try {
      if (localMethod.isBankAccount || localMethod.isPayoutCard) {
        // Verify with Connect account
        const externalAccount = await stripe.accounts.retrieveExternalAccount(
          user.stripeConnectId,
          paymentMethodId
        );
        isValid = externalAccount && externalAccount.status === 'new';
        stripeStatus = externalAccount.status;
      } else {
        // Verify with Customer
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        isValid = paymentMethod && paymentMethod.customer === user.stripeCustomerId;
        stripeStatus = 'active';
      }
    } catch (stripeError) {
      console.error("Stripe verification error:", stripeError);
      message = stripeError.message;
    }

    // Update local status if different
    if (isValid && localMethod.status !== 'active') {
      localMethod.status = 'active';
      await user.save();
    } else if (!isValid && localMethod.status === 'active') {
      localMethod.status = 'invalid';
      await user.save();
    }

    return successResponse(res, "Payment method verification completed", {
      paymentMethodId,
      isValid,
      status: localMethod.status,
      stripeStatus,
      message: message || (isValid ? 'Payment method is valid' : 'Payment method is invalid')
    });

  } catch (error) {
    console.error("Error verifying payment method:", error);
    return handleServerError(res, error);
  }
};

// Get payment method details for checkout
exports.getPaymentMethodForCheckout = async (req, res) => {
  try {
    const { preferredMethodId } = req.query;

    const user = await User.findById(req.user.id)
      .select("+stripeCustomerId +paymentMethods");

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    let selectedMethod;

    if (preferredMethodId) {
      selectedMethod = user.paymentMethods.find(pm => 
        pm.id === preferredMethodId && 
        pm.status === 'active' &&
        !pm.isBankAccount &&
        !pm.isPayoutCard
      );
    }

    // If no preferred method or preferred not found, use default
    if (!selectedMethod) {
      selectedMethod = user.paymentMethods.find(pm => 
        pm.isDefault && 
        pm.status === 'active' &&
        !pm.isBankAccount &&
        !pm.isPayoutCard
      );
    }

    // If still no method, use any active charge method
    if (!selectedMethod) {
      selectedMethod = user.paymentMethods.find(pm => 
        pm.status === 'active' &&
        !pm.isBankAccount &&
        !pm.isPayoutCard
      );
    }

    if (!selectedMethod) {
      return errorResponse(res, "No valid payment method found for checkout", 404);
    }

    // Update last used
    selectedMethod.lastUsed = new Date();
    await user.save();

    return successResponse(res, "Payment method ready for checkout", {
      paymentMethodId: selectedMethod.id,
      type: selectedMethod.type,
      last4: selectedMethod.metadata?.last4 || selectedMethod.metadata?.card?.last4,
      brand: selectedMethod.metadata?.card?.brand,
      nickname: selectedMethod.nickname
    });

  } catch (error) {
    console.error("Error getting payment method for checkout:", error);
    return handleServerError(res, error);
  }
};

// Helper function to sync payment methods with Stripe
async function syncPaymentMethodsWithStripe(user, localMethods) {
  const syncedMethods = [];
  
  for (const method of localMethods) {
    try {
      let isValid = false;
      
      if (method.isBankAccount || method.isPayoutCard) {
        // Check Connect account external accounts
        if (user.stripeConnectId) {
          try {
            await stripe.accounts.retrieveExternalAccount(
              user.stripeConnectId,
              method.id
            );
            isValid = true;
          } catch (e) {
            console.log(`External account ${method.id} not found in Stripe`);
          }
        }
      } else {
        // Check Customer payment methods
        if (user.stripeCustomerId) {
          try {
            const pm = await stripe.paymentMethods.retrieve(method.id);
            isValid = pm.customer === user.stripeCustomerId;
          } catch (e) {
            console.log(`Payment method ${method.id} not found in Stripe`);
          }
        }
      }
      
      if (isValid) {
        syncedMethods.push(method);
      } else {
        // Mark as inactive rather than removing
        method.status = 'inactive';
        syncedMethods.push(method);
      }
      
    } catch (error) {
      console.error(`Error syncing payment method ${method.id}:`, error);
      method.status = 'error';
      syncedMethods.push(method);
    }
  }
  
  return syncedMethods;
}

// Migrate legacy payment methods to new format
exports.migratePaymentMethods = async (req, res) => {
  try {
    const users = await User.find({
      paymentMethods: { $exists: true, $ne: [] }
    }).select("+paymentMethods");

    let migratedCount = 0;
    const errors = [];

    for (const user of users) {
      try {
        let updated = false;
        
        user.paymentMethods = user.paymentMethods.map(pm => {
          // Check if already in new format
          if (pm.metadata && pm.nickname) {
            return pm;
          }

          updated = true;
          
          return {
            ...pm,
            type: pm.isBankAccount ? 'bank_account' : (pm.isPayoutCard ? 'debit_card' : 'card'),
            nickname: pm.nickname || `Payment method ending in xxxx`,
            isDefault: pm.isDefault || false,
            status: pm.status || 'active',
            metadata: pm.metadata || {},
            lastUsed: pm.lastUsed || pm.addedAt,
            lastUpdated: new Date()
          };
        });

        if (updated) {
          await user.save();
          migratedCount++;
        }

      } catch (userError) {
        errors.push({
          userId: user._id,
          error: userError.message
        });
      }
    }

    return successResponse(res, "Payment method migration completed", {
      totalUsers: users.length,
      migratedCount,
      errors: errors.length,
      errorDetails: errors
    });

  } catch (error) {
    console.error("Error migrating payment methods:", error);
    return handleServerError(res, error);
  }
};

module.exports = exports;