const PaymentAutoPopulationService = require('../services/paymentAutoPopulationService');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');

/**
 * Payment Auto-Population Controller
 * Handles API endpoints for payment method auto-population and profile synchronization (Bug #4)
 */

// Get auto-populated payment data for forms
exports.getAutoPopulatedPaymentData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await PaymentAutoPopulationService.getAutoPopulatedPaymentData(userId);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, "Auto-populated payment data retrieved successfully", result.data);

  } catch (error) {
    console.error("Error getting auto-populated payment data:", error);
    return handleServerError(res, error);
  }
};

// Auto-populate payment form for specific context
exports.autoPopulatePaymentForm = async (req, res) => {
  try {
    const userId = req.user.id;
    const { context = 'general' } = req.query;

    // Validate context
    const validContexts = ['general', 'payout', 'subscription', 'deal_payment'];
    if (!validContexts.includes(context)) {
      return errorResponse(res, "Invalid context. Must be one of: " + validContexts.join(', '), 400);
    }

    const result = await PaymentAutoPopulationService.autoPopulatePaymentForm(userId, context);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, "Payment form auto-populated successfully", result.data);

  } catch (error) {
    console.error("Error auto-populating payment form:", error);
    return handleServerError(res, error);
  }
};

// Synchronize payment method updates
exports.synchronizePaymentUpdates = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Validate required fields
    if (!updateData.action) {
      return errorResponse(res, "Action is required", 400);
    }

    const validActions = ['add', 'update', 'remove'];
    if (!validActions.includes(updateData.action)) {
      return errorResponse(res, "Invalid action. Must be one of: " + validActions.join(', '), 400);
    }

    if ((updateData.action === 'add' || updateData.action === 'update' || updateData.action === 'remove') && !updateData.paymentMethodId) {
      return errorResponse(res, "Payment method ID is required for this action", 400);
    }

    const result = await PaymentAutoPopulationService.synchronizePaymentUpdates(userId, updateData);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result.message, result.syncResults);

  } catch (error) {
    console.error("Error synchronizing payment updates:", error);
    return handleServerError(res, error);
  }
};

// Get payment preferences
exports.getPaymentPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await PaymentAutoPopulationService.getPaymentPreferences(userId);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, "Payment preferences retrieved successfully", result.preferences);

  } catch (error) {
    console.error("Error getting payment preferences:", error);
    return handleServerError(res, error);
  }
};

// Update payment preferences
exports.updatePaymentPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const newPreferences = req.body;

    if (!newPreferences || Object.keys(newPreferences).length === 0) {
      return errorResponse(res, "Preferences data is required", 400);
    }

    const result = await PaymentAutoPopulationService.updatePaymentPreferences(userId, newPreferences);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result.message);

  } catch (error) {
    console.error("Error updating payment preferences:", error);
    return handleServerError(res, error);
  }
};

// Quick setup for new users - auto-detect and populate best payment method
exports.quickSetupPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { stripePaymentMethodId, setAsDefault = true, context = 'general' } = req.body;

    if (!stripePaymentMethodId) {
      return errorResponse(res, "Stripe payment method ID is required", 400);
    }

    // Add the payment method
    const syncResult = await PaymentAutoPopulationService.synchronizePaymentUpdates(userId, {
      action: 'add',
      paymentMethodId: stripePaymentMethodId,
      setAsDefault,
      type: 'card' // Assume card for quick setup
    });

    if (!syncResult.success) {
      return errorResponse(res, syncResult.error, 400);
    }

    // Get auto-populated form data for the new method
    const autoPopulateResult = await PaymentAutoPopulationService.autoPopulatePaymentForm(userId, context);

    return successResponse(res, "Payment method set up and auto-populated successfully", {
      setupResult: syncResult.syncResults,
      autoPopulateData: autoPopulateResult.success ? autoPopulateResult.data : null,
      isFirstPaymentMethod: syncResult.syncResults.added.length === 1,
      recommendations: generateSetupRecommendations(syncResult.syncResults)
    });

  } catch (error) {
    console.error("Error in quick payment setup:", error);
    return handleServerError(res, error);
  }
};

// Get payment method usage analytics
exports.getPaymentMethodAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = '30d' } = req.query;

    const paymentDataResult = await PaymentAutoPopulationService.getAutoPopulatedPaymentData(userId);
    
    if (!paymentDataResult.success) {
      return errorResponse(res, paymentDataResult.error, 400);
    }

    const { savedMethods } = paymentDataResult.data;

    // Generate analytics
    const analytics = {
      totalMethods: savedMethods.length,
      activeMethodsCount: savedMethods.filter(m => m.autoFillData.canAutoFill).length,
      expiredMethodsCount: savedMethods.filter(m => m.autoFillData.isExpired).length,
      
      methodDistribution: {
        cards: savedMethods.filter(m => m.type === 'card').length,
        bankAccounts: savedMethods.filter(m => m.type === 'bank_account').length
      },
      
      brandDistribution: savedMethods.reduce((acc, method) => {
        const brand = method.displayData.brand || 'Unknown';
        acc[brand] = (acc[brand] || 0) + 1;
        return acc;
      }, {}),
      
      recentActivity: {
        methodsAddedThisMonth: savedMethods.filter(m => {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return new Date(m.addedAt) >= oneMonthAgo;
        }).length,
        
        lastUsedMethod: savedMethods.find(m => m.lastUsed) || null,
        
        defaultMethodAge: savedMethods.find(m => m.isDefault) ? 
          Math.ceil((new Date() - new Date(savedMethods.find(m => m.isDefault).addedAt)) / (1000 * 60 * 60 * 24)) : 
          null
      },
      
      recommendations: generateAnalyticsRecommendations(savedMethods)
    };

    return successResponse(res, "Payment method analytics retrieved successfully", analytics);

  } catch (error) {
    console.error("Error getting payment method analytics:", error);
    return handleServerError(res, error);
  }
};

// Helper function to generate setup recommendations
const generateSetupRecommendations = (syncResults) => {
  const recommendations = [];

  if (syncResults.added.length === 1) {
    recommendations.push({
      type: 'first_setup',
      title: 'Payment Method Added Successfully',
      message: 'Your payment method has been saved and will be auto-populated in future forms.',
      action: 'Consider adding a backup payment method for redundancy'
    });
  }

  if (syncResults.added.some(m => m.isDefault)) {
    recommendations.push({
      type: 'default_set',
      title: 'Default Payment Method',
      message: 'This payment method is now your default and will be used for auto-population.',
      action: 'You can change this in your payment preferences'
    });
  }

  return recommendations;
};

// Helper function to generate analytics recommendations
const generateAnalyticsRecommendations = (savedMethods) => {
  const recommendations = [];

  // No payment methods
  if (savedMethods.length === 0) {
    recommendations.push({
      type: 'no_methods',
      priority: 'high',
      title: 'Add Your First Payment Method',
      message: 'Add a payment method to enable auto-population and faster checkouts',
      action: 'Add payment method'
    });
    return recommendations;
  }

  // Expired cards
  const expiredCount = savedMethods.filter(m => m.autoFillData.isExpired).length;
  if (expiredCount > 0) {
    recommendations.push({
      type: 'expired_cards',
      priority: 'high',
      title: `${expiredCount} Expired Payment Method${expiredCount > 1 ? 's' : ''}`,
      message: 'Update or remove expired payment methods to avoid payment failures',
      action: 'Update payment methods'
    });
  }

  // Only one payment method
  if (savedMethods.length === 1) {
    recommendations.push({
      type: 'single_method',
      priority: 'medium',
      title: 'Add a Backup Payment Method',
      message: 'Having multiple payment methods provides redundancy and flexibility',
      action: 'Add backup method'
    });
  }

  // No recent activity
  const hasRecentActivity = savedMethods.some(m => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return m.lastUsed && new Date(m.lastUsed) >= oneMonthAgo;
  });

  if (!hasRecentActivity && savedMethods.length > 0) {
    recommendations.push({
      type: 'inactive_methods',
      priority: 'low',
      title: 'Unused Payment Methods',
      message: 'Consider removing payment methods you no longer use',
      action: 'Review and clean up'
    });
  }

  return recommendations;
};

module.exports = exports;