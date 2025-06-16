const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Payment Auto-Population Service
 * Handles automatic population of saved payment details and profile synchronization (Bug #4)
 */

class PaymentAutoPopulationService {

  // Get user's saved payment methods with auto-population data
  static async getAutoPopulatedPaymentData(userId) {
    try {
      const user = await User.findById(userId).select('paymentMethods stripeCustomerId stripeConnectId');
      
      if (!user) {
        throw new Error('User not found');
      }

      const paymentData = {
        userId: user._id,
        hasStripeCustomer: !!user.stripeCustomerId,
        hasStripeConnect: !!user.stripeConnectId,
        savedMethods: [],
        defaultMethod: null,
        autoPopulateSettings: {
          enabled: true,
          syncAcrossDevices: true,
          rememberCardDetails: true
        }
      };

      // Process saved payment methods
      if (user.paymentMethods && user.paymentMethods.length > 0) {
        for (const method of user.paymentMethods) {
          try {
            // Get payment method details from Stripe
            const stripePaymentMethod = await this.getStripePaymentMethodDetails(method.id);
            
            const processedMethod = {
              id: method.id,
              type: method.isBankAccount ? 'bank_account' : 'card',
              isDefault: method.isDefault || false,
              isPayoutCard: method.isPayoutCard || false,
              addedAt: method.addedAt,
              lastUsed: method.lastUsed || null,
              
              // Auto-population friendly data
              displayData: {
                last4: stripePaymentMethod?.last4 || '****',
                brand: stripePaymentMethod?.brand || 'Unknown',
                expMonth: stripePaymentMethod?.expMonth,
                expYear: stripePaymentMethod?.expYear,
                funding: stripePaymentMethod?.funding || 'unknown'
              },
              
              // Pre-filled form data (secure)
              autoFillData: {
                cardType: stripePaymentMethod?.brand || '',
                isExpired: this.isCardExpired(stripePaymentMethod?.expMonth, stripePaymentMethod?.expYear),
                needsUpdate: this.needsUpdate(method),
                canAutoFill: true
              }
            };

            paymentData.savedMethods.push(processedMethod);

            // Set default method
            if (method.isDefault || (!paymentData.defaultMethod && processedMethod.type === 'card')) {
              paymentData.defaultMethod = processedMethod;
            }
            
          } catch (methodError) {
            console.warn(`Error processing payment method ${method.id}:`, methodError.message);
            
            // Add basic data even if Stripe call fails
            paymentData.savedMethods.push({
              id: method.id,
              type: method.isBankAccount ? 'bank_account' : 'card',
              isDefault: method.isDefault || false,
              addedAt: method.addedAt,
              displayData: { last4: '****', brand: 'Unknown' },
              autoFillData: { canAutoFill: false, error: 'Details unavailable' }
            });
          }
        }
      }

      // Sort methods by most recently used/added
      paymentData.savedMethods.sort((a, b) => {
        const aDate = new Date(a.lastUsed || a.addedAt);
        const bDate = new Date(b.lastUsed || b.addedAt);
        return bDate - aDate;
      });

      return {
        success: true,
        data: paymentData
      };

    } catch (error) {
      console.error('Error getting auto-populated payment data:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Auto-populate payment form with user's default method
  static async autoPopulatePaymentForm(userId, formContext = 'general') {
    try {
      const paymentDataResult = await this.getAutoPopulatedPaymentData(userId);
      
      if (!paymentDataResult.success) {
        return paymentDataResult;
      }

      const { data: paymentData } = paymentDataResult;

      // Determine best method based on context
      let selectedMethod = paymentData.defaultMethod;
      
      if (formContext === 'payout' && paymentData.savedMethods.length > 0) {
        // For payouts, prefer payout cards or bank accounts
        selectedMethod = paymentData.savedMethods.find(m => m.isPayoutCard || m.type === 'bank_account') || 
                        paymentData.defaultMethod;
      }

      if (!selectedMethod) {
        return {
          success: true,
          data: {
            hasAutoFillData: false,
            message: 'No saved payment methods available',
            suggestedActions: ['Add a new payment method']
          }
        };
      }

      // Generate auto-fill form data
      const autoFillData = {
        hasAutoFillData: true,
        paymentMethodId: selectedMethod.id,
        formData: {
          // Safe data that can be pre-filled
          cardType: selectedMethod.displayData.brand,
          last4: selectedMethod.displayData.last4,
          expMonth: selectedMethod.displayData.expMonth,
          expYear: selectedMethod.displayData.expYear,
          
          // UI hints
          displayName: `${selectedMethod.displayData.brand} ****${selectedMethod.displayData.last4}`,
          isDefault: selectedMethod.isDefault,
          needsVerification: selectedMethod.autoFillData.needsUpdate
        },
        
        // Available alternatives
        alternatives: paymentData.savedMethods
          .filter(m => m.id !== selectedMethod.id)
          .map(m => ({
            id: m.id,
            displayName: `${m.displayData.brand} ****${m.displayData.last4}`,
            type: m.type
          })),
          
        // Auto-population metadata
        autoPopulationInfo: {
          method: 'user_profile',
          confidence: selectedMethod.autoFillData.canAutoFill ? 'high' : 'low',
          lastUpdated: selectedMethod.addedAt,
          context: formContext
        }
      };

      return {
        success: true,
        data: autoFillData
      };

    } catch (error) {
      console.error('Error auto-populating payment form:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Synchronize payment method updates across user profile
  static async synchronizePaymentUpdates(userId, updateData) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const syncResults = {
        updated: [],
        added: [],
        removed: [],
        errors: []
      };

      // Handle new payment method addition
      if (updateData.action === 'add' && updateData.paymentMethodId) {
        const existingMethod = user.paymentMethods.find(m => m.id === updateData.paymentMethodId);
        
        if (!existingMethod) {
          const newMethod = {
            id: updateData.paymentMethodId,
            isBankAccount: updateData.type === 'bank_account',
            isPayoutCard: updateData.isPayoutCard || false,
            isDefault: updateData.setAsDefault || user.paymentMethods.length === 0,
            addedAt: new Date(),
            lastUsed: new Date()
          };

          // If setting as default, unset other defaults
          if (newMethod.isDefault) {
            user.paymentMethods.forEach(method => {
              method.isDefault = false;
            });
          }

          user.paymentMethods.push(newMethod);
          syncResults.added.push(newMethod);
        }
      }

      // Handle payment method update
      if (updateData.action === 'update' && updateData.paymentMethodId) {
        const methodIndex = user.paymentMethods.findIndex(m => m.id === updateData.paymentMethodId);
        
        if (methodIndex !== -1) {
          const method = user.paymentMethods[methodIndex];
          
          // Update fields
          if (updateData.setAsDefault !== undefined) {
            if (updateData.setAsDefault) {
              // Unset other defaults
              user.paymentMethods.forEach(m => m.isDefault = false);
            }
            method.isDefault = updateData.setAsDefault;
          }
          
          if (updateData.isPayoutCard !== undefined) {
            method.isPayoutCard = updateData.isPayoutCard;
          }
          
          method.lastUsed = new Date();
          syncResults.updated.push(method);
        }
      }

      // Handle payment method removal
      if (updateData.action === 'remove' && updateData.paymentMethodId) {
        const methodIndex = user.paymentMethods.findIndex(m => m.id === updateData.paymentMethodId);
        
        if (methodIndex !== -1) {
          const removedMethod = user.paymentMethods.splice(methodIndex, 1)[0];
          
          // If removed method was default, set new default
          if (removedMethod.isDefault && user.paymentMethods.length > 0) {
            user.paymentMethods[0].isDefault = true;
          }
          
          syncResults.removed.push(removedMethod);

          // Also remove from Stripe if needed
          try {
            await stripe.paymentMethods.detach(updateData.paymentMethodId);
          } catch (stripeError) {
            console.warn('Failed to detach payment method from Stripe:', stripeError.message);
          }
        }
      }

      // Save user updates
      await user.save();

      // Update Stripe customer if needed
      if (user.stripeCustomerId && (syncResults.added.length > 0 || syncResults.updated.length > 0)) {
        try {
          await this.updateStripeCustomerPaymentMethods(user.stripeCustomerId, user.paymentMethods);
        } catch (stripeError) {
          syncResults.errors.push(`Stripe sync error: ${stripeError.message}`);
        }
      }

      return {
        success: true,
        syncResults,
        message: 'Payment methods synchronized successfully'
      };

    } catch (error) {
      console.error('Error synchronizing payment updates:', error);
      return {
        success: false,
        error: error.message,
        syncResults: null
      };
    }
  }

  // Get payment method preferences for auto-population
  static async getPaymentPreferences(userId) {
    try {
      const user = await User.findById(userId).select('settings paymentMethods');
      
      const preferences = {
        autoPopulate: {
          enabled: user.settings?.payments?.autoPopulate !== false, // Default to true
          rememberCards: user.settings?.payments?.rememberCards !== false,
          syncAcrossDevices: user.settings?.payments?.syncAcrossDevices !== false
        },
        
        defaultBehavior: {
          setFirstAsDefault: true,
          useLastUsedFirst: true,
          preferPayoutCards: false // For general payments
        },
        
        security: {
          requireCVVAlways: user.settings?.payments?.requireCVV === true,
          autoExpireCards: user.settings?.payments?.autoExpireCards !== false,
          biometricAuth: user.settings?.payments?.biometricAuth === true
        },
        
        notifications: {
          paymentAdded: user.settings?.notifications?.paymentUpdates !== false,
          paymentExpiring: user.settings?.notifications?.cardExpiring !== false,
          unusualActivity: user.settings?.notifications?.unusualActivity !== false
        }
      };

      return {
        success: true,
        preferences
      };

    } catch (error) {
      console.error('Error getting payment preferences:', error);
      return {
        success: false,
        error: error.message,
        preferences: null
      };
    }
  }

  // Update payment preferences
  static async updatePaymentPreferences(userId, newPreferences) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize settings if not exists
      if (!user.settings) {
        user.settings = {};
      }
      if (!user.settings.payments) {
        user.settings.payments = {};
      }
      if (!user.settings.notifications) {
        user.settings.notifications = {};
      }

      // Update payment settings
      if (newPreferences.autoPopulate) {
        Object.assign(user.settings.payments, newPreferences.autoPopulate);
      }

      if (newPreferences.security) {
        Object.assign(user.settings.payments, newPreferences.security);
      }

      if (newPreferences.notifications) {
        Object.assign(user.settings.notifications, newPreferences.notifications);
      }

      await user.save();

      return {
        success: true,
        message: 'Payment preferences updated successfully'
      };

    } catch (error) {
      console.error('Error updating payment preferences:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper method to get Stripe payment method details
  static async getStripePaymentMethodDetails(paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (paymentMethod.card) {
        return {
          last4: paymentMethod.card.last4,
          brand: paymentMethod.card.brand,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
          funding: paymentMethod.card.funding,
          country: paymentMethod.card.country
        };
      } else if (paymentMethod.us_bank_account) {
        return {
          last4: paymentMethod.us_bank_account.last4,
          brand: 'Bank Account',
          bankName: paymentMethod.us_bank_account.bank_name,
          accountType: paymentMethod.us_bank_account.account_type
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get Stripe payment method details:', error.message);
      return null;
    }
  }

  // Helper method to check if card is expired
  static isCardExpired(expMonth, expYear) {
    if (!expMonth || !expYear) return false;
    
    const now = new Date();
    const expDate = new Date(expYear, expMonth - 1, 1);
    
    return expDate < now;
  }

  // Helper method to determine if payment method needs update
  static needsUpdate(paymentMethod) {
    // Check if added more than 6 months ago and never used
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return new Date(paymentMethod.addedAt) < sixMonthsAgo && !paymentMethod.lastUsed;
  }

  // Helper method to update Stripe customer payment methods
  static async updateStripeCustomerPaymentMethods(stripeCustomerId, paymentMethods) {
    try {
      // Update default payment method if needed
      const defaultMethod = paymentMethods.find(m => m.isDefault);
      
      if (defaultMethod) {
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: defaultMethod.id
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating Stripe customer:', error);
      throw error;
    }
  }
}

module.exports = PaymentAutoPopulationService;