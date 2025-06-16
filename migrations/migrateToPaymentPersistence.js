/**
 * Migration Script: Transition to Enhanced Payment Persistence System
 * 
 * This script helps transition from the basic payment method storage
 * to the enhanced encrypted payment persistence system.
 * 
 * Run with: node migrations/migrateToPaymentPersistence.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

// Encryption helper
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

async function migratePaymentMethods() {
  try {
    // Connect to MongoDB
    await mongoose.connect(`${process.env.MONGO_URI}AxeesDB`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find users with payment methods
    const users = await User.find({
      paymentMethods: { $exists: true, $ne: [] }
    }).select('+stripeCustomerId +stripeConnectId +paymentMethods');

    console.log(`Found ${users.length} users with payment methods to migrate`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const user of users) {
      try {
        console.log(`\nMigrating user ${user._id} (${user.userName || user.email})`);
        
        const updatedMethods = [];
        
        for (const method of user.paymentMethods) {
          try {
            // Skip if already migrated
            if (method.metadata && method.nickname) {
              console.log(`  - Method ${method.id} already migrated, skipping`);
              updatedMethods.push(method);
              continue;
            }

            console.log(`  - Migrating method ${method.id}`);
            
            // Initialize metadata object
            let metadata = {};
            let nickname = method.nickname;
            let type = method.type;
            
            // Determine method type and fetch details from Stripe
            if (method.isBankAccount || method.isPayoutCard) {
              // External account (bank or debit card for payouts)
              if (user.stripeConnectId) {
                try {
                  const externalAccount = await stripe.accounts.retrieveExternalAccount(
                    user.stripeConnectId,
                    method.id
                  );
                  
                  type = method.isBankAccount ? 'bank_account' : 'debit_card';
                  nickname = nickname || `${externalAccount.bank_name || 'Bank'} ending in ${externalAccount.last4}`;
                  
                  metadata = {
                    type: externalAccount.object,
                    last4: externalAccount.last4,
                    bankName: externalAccount.bank_name,
                    currency: externalAccount.currency,
                    country: externalAccount.country,
                    routingNumber: externalAccount.routing_number ? 
                      encrypt(externalAccount.routing_number) : null
                  };
                  
                  console.log(`    ✓ Retrieved ${type} details from Stripe`);
                } catch (stripeError) {
                  console.log(`    ⚠ Could not retrieve from Stripe: ${stripeError.message}`);
                  // Use default values
                  type = method.isBankAccount ? 'bank_account' : 'debit_card';
                  nickname = nickname || `${type === 'bank_account' ? 'Bank Account' : 'Debit Card'} ending in xxxx`;
                }
              }
            } else {
              // Payment method (card for charges)
              if (user.stripeCustomerId) {
                try {
                  const paymentMethod = await stripe.paymentMethods.retrieve(method.id);
                  
                  type = paymentMethod.type || 'card';
                  
                  if (paymentMethod.card) {
                    nickname = nickname || `${paymentMethod.card.brand} ending in ${paymentMethod.card.last4}`;
                    metadata = {
                      type: paymentMethod.type,
                      card: {
                        brand: paymentMethod.card.brand,
                        last4: paymentMethod.card.last4,
                        expMonth: paymentMethod.card.exp_month,
                        expYear: paymentMethod.card.exp_year,
                        fingerprint: paymentMethod.card.fingerprint,
                        funding: paymentMethod.card.funding
                      },
                      billingDetails: paymentMethod.billing_details
                    };
                  }
                  
                  console.log(`    ✓ Retrieved card details from Stripe`);
                } catch (stripeError) {
                  console.log(`    ⚠ Could not retrieve from Stripe: ${stripeError.message}`);
                  // Use default values
                  type = 'card';
                  nickname = nickname || 'Card ending in xxxx';
                }
              }
            }

            // Create updated method object
            const updatedMethod = {
              id: method.id,
              type: type || 'card',
              nickname: nickname,
              isDefault: method.isDefault || false,
              isBankAccount: method.isBankAccount || false,
              isPayoutCard: method.isPayoutCard || false,
              status: method.status || 'active',
              metadata: metadata,
              addedAt: method.addedAt || new Date(),
              lastUsed: method.lastUsed || method.addedAt || new Date(),
              lastUpdated: new Date()
            };

            updatedMethods.push(updatedMethod);
            console.log(`    ✓ Method migrated successfully`);
            
          } catch (methodError) {
            console.error(`    ✗ Error migrating method ${method.id}:`, methodError.message);
            // Keep original method to avoid data loss
            updatedMethods.push(method);
          }
        }

        // Update user's payment methods
        user.paymentMethods = updatedMethods;
        user.markModified('paymentMethods');
        await user.save();
        
        console.log(`✓ User ${user._id} migrated successfully (${updatedMethods.length} methods)`);
        successCount++;
        
      } catch (userError) {
        console.error(`✗ Error migrating user ${user._id}:`, userError.message);
        errors.push({
          userId: user._id,
          error: userError.message
        });
        errorCount++;
      }
    }

    // Summary
    console.log('\n=== Migration Summary ===');
    console.log(`Total users processed: ${users.length}`);
    console.log(`Successful migrations: ${successCount}`);
    console.log(`Failed migrations: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => {
        console.log(`  - User ${err.userId}: ${err.error}`);
      });
    }

    // Test verification - check a migrated user
    if (successCount > 0) {
      console.log('\n=== Verification Test ===');
      const testUser = await User.findOne({
        paymentMethods: { $exists: true, $ne: [] }
      }).select('+paymentMethods');
      
      if (testUser && testUser.paymentMethods.length > 0) {
        const testMethod = testUser.paymentMethods[0];
        console.log('Sample migrated method:');
        console.log(`  - ID: ${testMethod.id}`);
        console.log(`  - Type: ${testMethod.type}`);
        console.log(`  - Nickname: ${testMethod.nickname}`);
        console.log(`  - Has metadata: ${!!testMethod.metadata}`);
        console.log(`  - Status: ${testMethod.status}`);
      }
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed');
  }
}

// Run migration
console.log('Starting Payment Method Migration...\n');
migratePaymentMethods();