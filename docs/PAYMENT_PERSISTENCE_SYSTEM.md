# Payment Persistence System Documentation

## Overview
The Payment Persistence System provides secure storage and management of user payment methods with encryption for sensitive data. It ensures payment information is properly persisted across sessions while maintaining PCI compliance through Stripe integration.

## Key Features

### 1. Secure Payment Method Storage
- **Encryption**: Sensitive data encrypted using AES-256-GCM
- **Multiple Types**: Support for cards, bank accounts, and debit cards
- **Stripe Integration**: All payment methods verified with Stripe
- **Automatic Sync**: Regular validation with Stripe to ensure methods are current

### 2. Payment Method Management
- **Add Methods**: Store cards for charges or bank accounts for payouts
- **Update Methods**: Change nicknames, set defaults, activate/deactivate
- **Remove Methods**: Safe deletion with prevention of removing last method
- **Verification**: Real-time validation of payment method status

### 3. Smart Selection
- **Default Management**: Automatic default selection logic
- **Checkout Optimization**: Best method selection for checkout
- **Type Separation**: Clear distinction between charge and payout methods

## API Endpoints

### Add Payment Method
```
POST /api/payment-persistence/methods
```

**Request:**
```json
{
  "paymentMethodId": "pm_1234567890",
  "type": "card",
  "isDefault": true,
  "nickname": "Business Visa",
  "billingDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "address": {
      "line1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "US"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method added and persisted successfully",
  "data": {
    "paymentMethodId": "pm_1234567890",
    "type": "card",
    "nickname": "Business Visa",
    "isDefault": true,
    "last4": "4242",
    "brand": "visa"
  }
}
```

### Get Payment Methods
```
GET /api/payment-persistence/methods?includeInactive=false
```

**Response:**
```json
{
  "success": true,
  "message": "Payment methods retrieved successfully",
  "data": {
    "paymentMethods": [
      {
        "id": "pm_1234567890",
        "type": "card",
        "nickname": "Business Visa",
        "isDefault": true,
        "last4": "4242",
        "brand": "visa",
        "expMonth": 12,
        "expYear": 2025,
        "addedAt": "2024-01-15T10:00:00Z",
        "lastUsed": "2024-01-20T15:30:00Z",
        "status": "active",
        "canCharge": true,
        "canPayout": false
      },
      {
        "id": "ba_1234567890",
        "type": "bank_account",
        "nickname": "Business Checking",
        "isDefault": false,
        "last4": "6789",
        "bankName": "Chase",
        "addedAt": "2024-01-10T09:00:00Z",
        "lastUsed": "2024-01-18T14:00:00Z",
        "status": "active",
        "canCharge": false,
        "canPayout": true
      }
    ],
    "defaultMethodId": "pm_1234567890",
    "hasPayoutMethod": true,
    "hasChargeMethod": true
  }
}
```

### Update Payment Method
```
PUT /api/payment-persistence/methods/:paymentMethodId
```

**Request:**
```json
{
  "nickname": "Primary Business Card",
  "isDefault": true,
  "status": "active"
}
```

### Remove Payment Method
```
DELETE /api/payment-persistence/methods/:paymentMethodId
```

**Request:**
```json
{
  "force": false
}
```

### Verify Payment Method
```
POST /api/payment-persistence/methods/:paymentMethodId/verify
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method verification completed",
  "data": {
    "paymentMethodId": "pm_1234567890",
    "isValid": true,
    "status": "active",
    "stripeStatus": "active",
    "message": "Payment method is valid"
  }
}
```

### Get Method for Checkout
```
GET /api/payment-persistence/checkout?preferredMethodId=pm_1234567890
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method ready for checkout",
  "data": {
    "paymentMethodId": "pm_1234567890",
    "type": "card",
    "last4": "4242",
    "brand": "visa",
    "nickname": "Business Visa"
  }
}
```

## Database Schema Enhancement

### User Model Payment Methods Array
```javascript
paymentMethods: [{
  id: String,                    // Stripe payment method or external account ID
  type: String,                  // 'card', 'bank_account', 'debit_card'
  nickname: String,              // User-friendly name
  isDefault: Boolean,            // Default for charges
  isBankAccount: Boolean,        // True for ACH payouts
  isPayoutCard: Boolean,         // True for instant debit card payouts
  addedAt: Date,                 // When added
  lastUsed: Date,                // Last transaction
  lastUpdated: Date,             // Last modification
  status: {
    type: String,
    enum: ['active', 'inactive', 'invalid', 'error'],
    default: 'active'
  },
  metadata: {                    // Encrypted sensitive data
    type: mongoose.Schema.Types.Mixed,
    select: false                // Not returned by default
  }
}]
```

## Security Implementation

### 1. Encryption
```javascript
// Encryption for sensitive data
const encrypt = (text) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.PAYMENT_ENCRYPTION_KEY, 'utf8');
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
```

### 2. Environment Variables
```env
# Required for payment persistence
PAYMENT_ENCRYPTION_KEY=your-32-character-encryption-key-here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PLATFORM_ACCOUNT_ID=acct_...
```

### 3. Security Best Practices
- Never store raw card numbers or CVV
- All sensitive data encrypted at rest
- Regular sync with Stripe to validate methods
- Audit logs for all payment method operations
- PCI compliance maintained through Stripe

## Integration Points

### 1. Payment Controller Integration
```javascript
// In paymentController.js
const { getPaymentMethodForCheckout } = require('./paymentPersistenceController');

// During checkout
const paymentMethod = await getPaymentMethodForCheckout(req, res);
// Use paymentMethod.data.paymentMethodId for Stripe charge
```

### 2. Trial Offer Integration
```javascript
// Automatic selection of payment method for trial conversions
const method = await getPaymentMethodForCheckout({ 
  user: { id: userId },
  query: {}
});
```

### 3. Withdrawal Integration
```javascript
// Get payout methods for withdrawal
const methods = await getPersistedPaymentMethods({
  user: { id: userId },
  query: { includeInactive: false }
});
const payoutMethods = methods.data.paymentMethods.filter(m => m.canPayout);
```

## Error Handling

### Common Error Scenarios
1. **No Payment Method**: User has no stored payment methods
2. **Invalid Method**: Stripe reports method as invalid
3. **Expired Card**: Card expiration detected
4. **Insufficient Permissions**: User cannot access another user's methods
5. **Stripe Sync Failure**: Unable to verify with Stripe

### Error Response Format
```json
{
  "success": false,
  "error": "No valid payment method found for checkout",
  "code": 404,
  "details": {
    "availableMethods": 0,
    "suggestion": "Please add a payment method first"
  }
}
```

## Migration Support

### Legacy Payment Method Migration
- Automatic detection of old format
- Batch migration endpoint for admins
- Preserves all existing data
- Updates to new encrypted format
- Audit trail of migrations

### Migration Endpoint
```
POST /api/payment-persistence/migrate
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method migration completed",
  "data": {
    "totalUsers": 150,
    "migratedCount": 145,
    "errors": 5,
    "errorDetails": [...]
  }
}
```

## Best Practices

### For Implementation
1. **Always Encrypt**: Never store sensitive payment data unencrypted
2. **Validate with Stripe**: Check method validity before transactions
3. **Handle Failures Gracefully**: Provide fallback options
4. **Update Last Used**: Track usage for better UX
5. **Regular Cleanup**: Remove invalid methods periodically

### For Users
1. **Multiple Methods**: Encourage having backup payment methods
2. **Clear Naming**: Use descriptive nicknames
3. **Regular Updates**: Keep payment information current
4. **Security Awareness**: Report suspicious activity

### For Maintenance
1. **Monitor Sync Failures**: Track Stripe validation errors
2. **Encryption Key Rotation**: Plan for key rotation strategy
3. **Audit Logging**: Maintain logs of all payment method changes
4. **Performance Monitoring**: Track sync operation times

## Monitoring & Alerts

### Key Metrics
- Payment method addition success rate
- Stripe sync failure rate
- Average methods per user
- Checkout success rate
- Method validation frequency

### Alert Triggers
- High sync failure rate (>5%)
- Encryption/decryption errors
- Unusual deletion patterns
- Multiple failed checkout attempts

## Future Enhancements

1. **Multi-Currency Support**: Store preferred currency per method
2. **Spending Limits**: Per-method transaction limits
3. **Method Sharing**: Share methods across team accounts
4. **Advanced Analytics**: Payment method usage insights
5. **3D Secure Integration**: Enhanced security for European cards
6. **Wallet Integration**: Apple Pay, Google Pay support
7. **Cryptocurrency**: Support for crypto payment methods

## Testing Considerations

### Test Scenarios
1. Add multiple payment methods
2. Set and change defaults
3. Remove last payment method (should fail)
4. Verify expired cards
5. Sync with invalid Stripe methods
6. Encryption/decryption cycles
7. Migration of legacy data

### Test Payment Methods
- Valid card: `pm_card_visa`
- Expired card: `pm_card_visa_chargeDeclined`
- Valid bank: Use Stripe test bank tokens
- Invalid bank: Use declined bank tokens

This payment persistence system ensures secure, reliable storage of payment methods while maintaining flexibility for various payment scenarios in the Axees platform.