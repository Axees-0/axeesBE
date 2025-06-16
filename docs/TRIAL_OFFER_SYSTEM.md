# $1 Trial Offer System Documentation

## Overview
The Trial Offer System allows marketers to create low-risk $1 trial offers that automatically convert to full-price deals after a specified trial period. This system is designed to reduce friction in the creator-marketer collaboration process and increase conversion rates.

## Key Features

### 1. Trial Offer Creation
- **$1 Default Trial Amount**: Low barrier to entry for testing collaborations
- **Customizable Trial Duration**: Default 7 days, configurable per offer
- **Full Amount Specification**: Clear visibility of post-trial pricing
- **Automatic Conversion Scheduling**: System calculates conversion dates

### 2. Payment Processing
- **Instant $1 Payment**: Processed immediately upon creator acceptance
- **Secure Payment Methods**: Uses stored payment methods with Stripe
- **Platform Fees**: 10% commission on all transactions
- **Creator Payouts**: Direct transfers to creator's Stripe Connect account

### 3. Trial Management
- **Status Tracking**: Pending → Active → Converted/Cancelled/Expired
- **Automatic Reminders**: 3-day and 1-day warnings before trial ends
- **Manual Conversion**: Either party can convert early
- **Cancellation Options**: Both parties can cancel during trial

### 4. Automatic Conversion
- **Smart Scheduling**: Converts 24 hours after trial end
- **Payment Processing**: Charges remaining balance automatically
- **Deal Creation**: Seamlessly transitions to full deal
- **Notification System**: Alerts both parties of conversion

## API Endpoints

### Create Trial Offer
```
POST /api/trial-offers
```

**Request Body:**
```json
{
  "marketerId": "64f7b8e8c123456789abcdef",
  "creatorId": "64f7b8e8c123456789abcdef",
  "offerName": "Instagram Campaign - Q1 2024",
  "description": "3 posts and 2 stories for product launch",
  "platforms": ["instagram"],
  "deliverables": [
    "3 Instagram feed posts",
    "2 Instagram stories",
    "1 week of engagement"
  ],
  "trialAmount": 1,
  "trialDuration": 7,
  "fullAmount": 500,
  "desiredReviewDate": "2024-01-20",
  "desiredPostDate": "2024-01-25"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trial offer created successfully",
  "data": {
    "offer": {
      "_id": "64f7b8e8c123456789abcdef",
      "offerType": "trial",
      "status": "Pending",
      "trialDetails": {
        "isTrialOffer": true,
        "trialAmount": 1,
        "trialDuration": 7,
        "fullAmount": 500,
        "autoConvertDate": "2024-01-28T10:00:00Z",
        "trialStatus": "pending"
      }
    },
    "trialInfo": {
      "trialAmount": "$1",
      "trialDuration": "7 days",
      "fullAmount": "$500",
      "autoConvertDate": "2024-01-28T10:00:00Z"
    }
  }
}
```

### Accept Trial Offer
```
POST /api/trial-offers/:offerId/accept
```

**Request Body:**
```json
{
  "creatorId": "64f7b8e8c123456789abcdef"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trial offer accepted successfully",
  "data": {
    "offer": {
      "status": "Accepted",
      "trialDetails": {
        "trialStatus": "active",
        "trialStartDate": "2024-01-21T10:00:00Z",
        "trialEndDate": "2024-01-28T10:00:00Z",
        "paymentIntentId": "pi_1234567890"
      }
    },
    "deal": {
      "_id": "64f7b8e8c123456789abcdef",
      "dealName": "Trial: Instagram Campaign - Q1 2024",
      "status": "trial_active"
    },
    "trialInfo": {
      "status": "active",
      "startDate": "2024-01-21T10:00:00Z",
      "endDate": "2024-01-28T10:00:00Z",
      "paymentStatus": "succeeded",
      "nextSteps": "Complete trial deliverables to convert to full deal"
    }
  }
}
```

### Convert Trial to Full Offer
```
POST /api/trial-offers/:offerId/convert
```

**Request Body:**
```json
{
  "initiatedBy": "64f7b8e8c123456789abcdef",
  "conversionType": "manual"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trial converted to full offer successfully",
  "data": {
    "conversion": {
      "type": "manual",
      "trialAmount": 1,
      "fullAmount": 500,
      "remainingPaid": 499,
      "paymentStatus": "succeeded"
    }
  }
}
```

### Cancel Trial Offer
```
POST /api/trial-offers/:offerId/cancel
```

**Request Body:**
```json
{
  "userId": "64f7b8e8c123456789abcdef",
  "reason": "Project requirements changed"
}
```

### Get Trial Statistics
```
GET /api/trial-offers/stats?userId=xxx&timeframe=30d
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "pending": 5,
    "active": 3,
    "converted": 15,
    "cancelled": 1,
    "expired": 1,
    "conversionRate": 75,
    "averageTrialAmount": 1,
    "averageFullAmount": 450,
    "totalRevenue": 6750
  }
}
```

### Get Active Trials
```
GET /api/trial-offers/active?userId=xxx
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trials": [
      {
        "offer": { /* offer details */ },
        "status": {
          "daysRemaining": 2,
          "isExpired": false,
          "requiresAction": true
        },
        "actions": {
          "canConvert": true,
          "canCancel": true,
          "canExtend": false
        },
        "recommendation": "Trial ending soon! Take action to avoid automatic conversion."
      }
    ],
    "summary": {
      "total": 3,
      "expiring": 2,
      "expired": 0
    }
  }
}
```

## Database Schema

### Offer Model Enhancement
```javascript
{
  offerType: {
    type: String,
    enum: ["standard", "trial", "premium"],
    default: "standard"
  },
  trialDetails: {
    isTrialOffer: Boolean,
    trialAmount: Number,        // $1 default
    trialDuration: Number,      // Days
    fullAmount: Number,         // Post-trial amount
    autoConvertDate: Date,      // Automatic conversion date
    trialStatus: {
      type: String,
      enum: ["pending", "active", "converted", "cancelled", "expired"]
    },
    trialStartDate: Date,
    trialEndDate: Date,
    conversionDate: Date,
    paymentIntentId: String,    // Stripe payment intent
    subscriptionId: String,     // For recurring trials
    remindersSent: [{
      type: String,
      sentAt: Date,
      messageId: String
    }]
  }
}
```

## Automated Processes

### 1. Trial Conversion Job
- **Schedule**: Runs hourly
- **Process**: 
  - Finds active trials past auto-convert date
  - Processes payment for remaining amount
  - Updates offer and deal status
  - Sends conversion notifications

### 2. Trial Reminder Job
- **Schedule**: Runs daily at 10 AM
- **Reminders**:
  - 3 days before trial end
  - 1 day before trial end
  - On expiration if not converted

### 3. Trial Statistics Collection
- **Schedule**: Daily at 10 AM
- **Metrics**: Conversion rates, revenue, status distribution

## Notification System

### Email Notifications
1. **New Trial Offer**: Sent to creator when trial offer created
2. **Trial Accepted**: Sent to marketer when creator accepts
3. **Trial Started**: Confirmation to both parties
4. **Trial Ending**: Reminder at 3 days and 1 day
5. **Trial Converted**: Success notification to both parties
6. **Trial Cancelled**: Cancellation notice with reason
7. **Trial Expired**: Action required notification

### Push Notifications
- Same events as email with mobile-optimized messaging
- Deep links to relevant screens in mobile app
- Badge updates for pending actions

## Integration with Existing Systems

### 1. Standard Offer Creation
The trial offer system extends the existing offer creation:
```javascript
// In marketerOfferController.js
if (req.body.offerType === 'trial' || req.body.isTrialOffer) {
  // Trial-specific setup
  offerData.trialDetails = {
    isTrialOffer: true,
    trialAmount: req.body.trialAmount || 1,
    // ... other trial details
  };
}
```

### 2. Payment Integration
- Uses existing Stripe setup
- Leverages stored payment methods
- Maintains platform fee structure

### 3. Deal Creation
- Automatic deal creation on trial acceptance
- Special "trial_active" status
- Seamless transition to full deal

## Security Considerations

### 1. Authorization
- Only offer parties can accept/convert/cancel
- Marketer must have payment method on file
- Creator must have Stripe Connect account

### 2. Payment Security
- All payments through Stripe
- No credit card details stored
- PCI compliance maintained

### 3. Rate Limiting
- Trial creation limited per marketer
- Conversion attempts throttled
- Reminder frequency controlled

## Best Practices

### For Marketers
1. **Clear Deliverables**: Specify trial period expectations
2. **Realistic Timelines**: Allow enough time for trial completion
3. **Fair Pricing**: Ensure full amount reflects value
4. **Prompt Communication**: Respond quickly during trial

### For Creators
1. **Quick Response**: Accept/decline trials promptly
2. **Trial Completion**: Deliver trial work on time
3. **Quality Focus**: Treat trial as full project
4. **Clear Communication**: Update marketer on progress

### For Platform
1. **Monitor Conversion Rates**: Track success metrics
2. **Adjust Defaults**: Optimize trial duration based on data
3. **User Education**: Provide trial best practices
4. **Support Resources**: Help with common issues

## Error Handling

### Payment Failures
- Retry logic with exponential backoff
- Notification to both parties
- Manual intervention options
- Grace period before cancellation

### Conversion Failures
- Fallback to "expired" status
- Admin notification for investigation
- User-friendly error messages
- Recovery options provided

## Future Enhancements

1. **Flexible Trial Amounts**: Allow custom trial pricing
2. **Trial Extensions**: Marketer can extend trial period
3. **Multiple Trials**: Bundle offers with single trial
4. **Performance Metrics**: Show creator trial success rate
5. **Smart Recommendations**: AI-suggested trial terms
6. **Subscription Trials**: Recurring payment models
7. **Trial Templates**: Pre-configured trial offers

## Monitoring & Analytics

### Key Metrics
- Trial creation rate
- Acceptance rate
- Conversion rate
- Average trial-to-full revenue
- Time to conversion
- Cancellation reasons

### Alerts
- High cancellation rate
- Payment processing failures
- Conversion job failures
- Unusual trial patterns

This trial offer system provides a low-risk entry point for creator-marketer collaborations while maintaining platform revenue and ensuring smooth user experience.