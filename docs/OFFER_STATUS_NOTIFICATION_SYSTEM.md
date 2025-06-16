# Comprehensive Offer Status Notification System

## Overview
The Comprehensive Offer Status Notification System provides intelligent, multi-channel notifications for all offer and deal status changes. It features customizable user preferences, beautiful email templates, scheduled notifications, and comprehensive analytics to keep all parties informed throughout the collaboration lifecycle.

## Key Features

### 1. Multi-Channel Delivery
- **Push Notifications**: Real-time mobile/web push notifications
- **Email Notifications**: Rich HTML email templates with branding
- **In-App Notifications**: Dashboard notifications with read/unread tracking
- **SMS Notifications**: Optional SMS delivery for critical updates

### 2. Intelligent Notification Types
- **Offer Management**: Created, accepted, rejected, negotiation updates
- **Deal Lifecycle**: Payment required, in progress, completed
- **Milestone Tracking**: Due soon, completed, overdue alerts
- **Content Workflow**: Submitted, approved, revision required
- **Payment Events**: Released, scheduled, overdue notifications

### 3. Smart Scheduling & Automation
- **Scheduled Notifications**: Cron-based automatic reminders
- **User Preferences**: Customizable frequency and channel settings
- **Quiet Hours**: Respect user timezone and quiet time preferences
- **Priority Levels**: High, medium, low priority handling

### 4. Comprehensive Analytics
- **Delivery Tracking**: Monitor notification delivery success
- **Read Rates**: Track user engagement with notifications
- **Channel Performance**: Analyze effectiveness of different channels
- **Personalized Recommendations**: AI-driven preference suggestions

## Notification Types & Configurations

### Offer-Related Notifications

#### OFFER_CREATED
- **Priority**: High
- **Channels**: Push, Email, In-App
- **Immediate**: Yes
- **Template**: Rich email with offer details and call-to-action

#### OFFER_ACCEPTED
- **Priority**: High
- **Channels**: Push, Email, In-App
- **Immediate**: Yes
- **Template**: Congratulations email with next steps

#### OFFER_REJECTED
- **Priority**: Medium
- **Channels**: Push, Email, In-App
- **Immediate**: Yes
- **Template**: Polite rejection with alternative suggestions

#### OFFER_NEGOTIATION
- **Priority**: Medium
- **Channels**: Push, In-App
- **Immediate**: Yes
- **Template**: Negotiation update with current terms

### Deal-Related Notifications

#### DEAL_PAYMENT_REQUIRED
- **Priority**: High
- **Channels**: Push, Email, In-App
- **Immediate**: Yes
- **Template**: Urgent payment reminder with secure payment link

#### DEAL_IN_PROGRESS
- **Priority**: Medium
- **Channels**: Push, In-App
- **Immediate**: No
- **Template**: Deal started confirmation

#### DEAL_COMPLETED
- **Priority**: High
- **Channels**: Push, Email, In-App
- **Immediate**: Yes
- **Template**: Completion celebration with final summary

### Milestone & Content Notifications

#### MILESTONE_DUE
- **Priority**: Medium
- **Channels**: Push, Email
- **Immediate**: No (Scheduled)
- **Template**: Friendly reminder with progress tracking

#### CONTENT_SUBMITTED
- **Priority**: High
- **Channels**: Push, Email, In-App
- **Immediate**: Yes
- **Template**: Review required with content preview

#### CONTENT_APPROVED
- **Priority**: High
- **Channels**: Push, Email, In-App
- **Immediate**: Yes
- **Template**: Approval confirmation with next steps

#### CONTENT_REVISION_REQUIRED
- **Priority**: High
- **Channels**: Push, Email, In-App
- **Immediate**: Yes
- **Template**: Revision request with specific feedback

### Payment Notifications

#### PAYMENT_RELEASED
- **Priority**: High
- **Channels**: Push, Email, In-App
- **Immediate**: Yes
- **Template**: Payment confirmation with transaction details

## API Endpoints

### Send Individual Notification
```
POST /api/offer-notifications/send
```

**Request Body:**
```json
{
  "userId": "64f7b8e8c123456789abcdef",
  "notificationType": "OFFER_CREATED",
  "dealId": "64f7b8e8c123456789abcdef",
  "offerId": "64f7b8e8c123456789abcdef",
  "data": {
    "offerName": "Instagram Campaign Q1",
    "marketerName": "John Smith",
    "creatorName": "Jane Doe",
    "paymentAmount": 1000,
    "platforms": ["Instagram", "TikTok"],
    "timeline": "2 weeks"
  },
  "channels": ["push", "email", "in_app"],
  "priority": "high",
  "scheduledFor": "2024-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comprehensive notification sent successfully",
  "data": {
    "notificationType": "OFFER_CREATED",
    "channels": ["push", "email", "in_app"],
    "priority": "high",
    "userId": "64f7b8e8c123456789abcdef",
    "scheduledFor": "2024-01-15T10:00:00Z"
  }
}
```

### Send Bulk Notifications
```
POST /api/offer-notifications/bulk
```

**Request Body:**
```json
{
  "notifications": [
    {
      "userId": "64f7b8e8c123456789abcdef",
      "notificationType": "MILESTONE_DUE",
      "data": {
        "dealName": "Campaign Q1",
        "milestoneTitle": "Content Creation",
        "dueDate": "2024-01-20T10:00:00Z"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk notifications processed",
  "data": {
    "total": 1,
    "successful": 1,
    "failed": 0,
    "results": [
      {
        "userId": "64f7b8e8c123456789abcdef",
        "type": "MILESTONE_DUE",
        "status": "sent"
      }
    ],
    "errors": []
  }
}
```

### Get User Notification Preferences
```
GET /api/offer-notifications/preferences
```

**Response:**
```json
{
  "success": true,
  "message": "Notification preferences retrieved successfully",
  "data": {
    "preferences": {
      "push": true,
      "email": true,
      "in_app": true,
      "sms": false,
      "frequency": "immediate",
      "quietHours": {
        "enabled": true,
        "start": "22:00",
        "end": "08:00",
        "timezone": "America/New_York"
      },
      "categories": {
        "offers": true,
        "payments": true,
        "milestones": true,
        "content": true,
        "reminders": true
      }
    },
    "availableTypes": [
      "OFFER_CREATED",
      "OFFER_ACCEPTED",
      "DEAL_PAYMENT_REQUIRED",
      "MILESTONE_DUE",
      "CONTENT_SUBMITTED",
      "PAYMENT_RELEASED"
    ],
    "channels": ["push", "email", "in_app", "sms"]
  }
}
```

### Update Notification Preferences
```
PUT /api/offer-notifications/preferences
```

**Request Body:**
```json
{
  "preferences": {
    "push": true,
    "email": true,
    "in_app": true,
    "sms": false,
    "frequency": "hourly",
    "quietHours": {
      "enabled": true,
      "start": "23:00",
      "end": "07:00",
      "timezone": "America/New_York"
    },
    "categories": {
      "offers": true,
      "payments": true,
      "milestones": true,
      "content": true,
      "reminders": false
    }
  }
}
```

### Get Notification Analytics
```
GET /api/offer-notifications/analytics?timeframe=30d
```

**Response:**
```json
{
  "success": true,
  "message": "Notification analytics retrieved successfully",
  "data": {
    "timeframe": "30d",
    "analytics": {
      "total": 45,
      "unread": 8,
      "byType": {
        "OFFER_CREATED": 12,
        "DEAL_PAYMENT_REQUIRED": 8,
        "MILESTONE_DUE": 15,
        "CONTENT_SUBMITTED": 10
      },
      "byPriority": {
        "high": 20,
        "medium": 18,
        "low": 7
      },
      "readRate": "82.2%",
      "averageResponseTime": 1.5,
      "channelPerformance": {
        "push": { "sent": 45, "delivered": 42, "opened": 38 },
        "email": { "sent": 30, "delivered": 28, "opened": 22 },
        "in_app": { "sent": 45, "read": 37 }
      }
    },
    "recentNotifications": [
      {
        "id": "64f7b8e8c123456789abcdef",
        "type": "OFFER_CREATED",
        "title": "New Offer Received",
        "createdAt": "2024-01-15T10:00:00Z",
        "unread": false
      }
    ],
    "recommendations": [
      {
        "type": "optimize_frequency",
        "message": "Consider reducing notification frequency for better engagement",
        "action": "review_preferences"
      }
    ]
  }
}
```

## Email Templates

### Template Structure
All email templates use a consistent structure with:
- **Header**: Axees logo and branding
- **Content**: Notification-specific content with data placeholders
- **Call-to-Action**: Primary action button
- **Footer**: Company information and preference management

### Template Variables
Templates support dynamic content insertion:
- `${data.offerName}` - Offer/campaign name
- `${data.marketerName}` - Marketer's name
- `${data.creatorName}` - Creator's name
- `${data.paymentAmount}` - Payment amount
- `${data.platforms}` - Social media platforms
- `${data.dueDate}` - Due date for milestones/content
- `${data.dealName}` - Deal name
- `${data.milestoneTitle}` - Milestone title

### Responsive Design
Templates are optimized for:
- **Desktop**: Full-width layout with rich formatting
- **Mobile**: Responsive design with touch-friendly buttons
- **Dark Mode**: Automatic adaptation for dark mode preferences

## Scheduled Notifications System

### Cron Job Schedule
- **Frequency**: Every 6 hours (0 */6 * * *)
- **Timezone**: UTC
- **Function**: Process scheduled notifications and reminders

### Automated Reminders

#### Milestone Due Soon (3 days before)
- **Target**: Creators with upcoming milestones
- **Channels**: Push, Email
- **Content**: Friendly reminder with progress tracking

#### Payment Overdue (7 days after acceptance)
- **Target**: Marketers with overdue payments
- **Channels**: Push, Email
- **Content**: Urgent payment reminder with secure link

#### Content Submission Deadline (2 days before)
- **Target**: Creators with upcoming content deadlines
- **Channels**: Push, Email
- **Content**: Deadline reminder with submission portal

#### Trial Conversion Reminder (1 day before)
- **Target**: Marketers with trial offers converting soon
- **Channels**: Push, Email
- **Content**: Conversion reminder with upgrade options

#### Deal Completion Follow-up (3 days after)
- **Target**: Both parties in recently completed deals
- **Channels**: Push, Email
- **Content**: Completion celebration and feedback request

## User Preference Management

### Preference Categories
- **Offers**: New offers, acceptances, rejections
- **Payments**: Payment required, released, overdue
- **Milestones**: Due soon, completed, overdue
- **Content**: Submitted, approved, revisions needed
- **Reminders**: General reminders and follow-ups

### Frequency Options
- **Immediate**: Real-time notifications (default)
- **Hourly**: Batched hourly summaries
- **Daily**: Daily digest emails
- **Weekly**: Weekly summary reports

### Quiet Hours
- **Customizable**: Set start/end times
- **Timezone-Aware**: Respects user's timezone
- **Smart Delivery**: Holds non-urgent notifications

## Integration Points

### 1. Deal Management System
```javascript
// Automatic notification on deal status change
const dealStatusChanged = async (dealId, newStatus, previousStatus) => {
  const deal = await Deal.findById(dealId).populate('creatorId marketerId');
  
  const notificationType = getNotificationTypeForDealStatus(newStatus);
  if (notificationType) {
    await sendOfferStatusNotification({
      body: {
        userId: deal.creatorId._id,
        notificationType,
        dealId: deal._id,
        data: {
          dealName: deal.dealName,
          marketerName: deal.marketerId.userName,
          status: newStatus,
          previousStatus
        }
      }
    }, mockRes);
  }
};
```

### 2. Milestone System
```javascript
// Automatic notification on milestone completion
const milestoneCompleted = async (dealId, milestoneId) => {
  const deal = await Deal.findById(dealId).populate('creatorId marketerId');
  const milestone = deal.milestones.find(m => m._id.toString() === milestoneId);
  
  await sendOfferStatusNotification({
    body: {
      userId: deal.marketerId._id,
      notificationType: 'MILESTONE_COMPLETED',
      dealId: deal._id,
      data: {
        dealName: deal.dealName,
        milestoneTitle: milestone.name,
        creatorName: deal.creatorId.userName,
        completedAt: new Date().toISOString()
      }
    }
  }, mockRes);
};
```

### 3. Payment System
```javascript
// Automatic notification on payment release
const paymentReleased = async (dealId, amount, releaseType) => {
  const deal = await Deal.findById(dealId).populate('creatorId marketerId');
  
  await sendOfferStatusNotification({
    body: {
      userId: deal.creatorId._id,
      notificationType: 'PAYMENT_RELEASED',
      dealId: deal._id,
      data: {
        dealName: deal.dealName,
        amount: amount,
        releaseType: releaseType,
        marketerName: deal.marketerId.userName
      }
    }
  }, mockRes);
};
```

## Analytics & Reporting

### Notification Metrics
- **Delivery Rate**: Percentage of notifications successfully delivered
- **Open Rate**: Percentage of notifications opened/read
- **Click-Through Rate**: Percentage of notifications with action taken
- **Response Time**: Average time from notification to user action

### User Engagement Scoring
- **High Engagement**: >80% read rate, quick response times
- **Medium Engagement**: 50-80% read rate, moderate response times
- **Low Engagement**: <50% read rate, slow response times

### Recommendations Engine
- **Frequency Optimization**: Suggest optimal notification frequency
- **Channel Optimization**: Recommend best channels for each user
- **Content Optimization**: Suggest notification content improvements
- **Timing Optimization**: Recommend best delivery times

## Security & Privacy

### Data Protection
- **Encryption**: All notification data encrypted in transit and at rest
- **Access Control**: Role-based access to notification management
- **Audit Trail**: Complete logging of all notification activities
- **GDPR Compliance**: User consent management and data deletion rights

### Spam Prevention
- **Rate Limiting**: Prevent excessive notifications to users
- **Content Filtering**: Automatic spam detection and prevention
- **User Blocking**: Allow users to block specific notification types
- **Unsubscribe Options**: Easy opt-out for all communications

## Performance Optimization

### Caching Strategy
- **Template Caching**: Cache compiled email templates
- **Preference Caching**: Cache user preferences for faster lookup
- **Channel Caching**: Cache delivery channel configurations

### Queue Management
- **Batch Processing**: Group similar notifications for efficient processing
- **Priority Queues**: Separate queues for different priority levels
- **Retry Logic**: Automatic retry for failed deliveries
- **Dead Letter Queues**: Handle permanently failed notifications

### Monitoring & Alerting
- **Delivery Monitoring**: Real-time tracking of notification delivery
- **Error Alerting**: Immediate alerts for critical failures
- **Performance Metrics**: Track processing times and throughput
- **Health Checks**: Regular system health verification

## Testing & Quality Assurance

### Unit Testing
- **Template Rendering**: Verify template compilation and variable substitution
- **Preference Logic**: Test user preference application
- **Channel Selection**: Validate channel selection logic
- **Priority Handling**: Ensure correct priority processing

### Integration Testing
- **End-to-End Flow**: Test complete notification workflows
- **External Services**: Verify integration with email/SMS providers
- **Database Operations**: Test data persistence and retrieval
- **Error Handling**: Validate error scenarios and recovery

### Load Testing
- **High Volume**: Test system under high notification volumes
- **Concurrent Users**: Verify performance with many simultaneous users
- **Burst Traffic**: Test handling of sudden traffic spikes
- **Resource Limits**: Identify system bottlenecks and limits

## Best Practices

### For Developers
1. **Template Consistency**: Maintain consistent branding across all templates
2. **Error Handling**: Implement robust error handling and logging
3. **Performance**: Optimize queries and caching for high throughput
4. **Testing**: Write comprehensive tests for all notification scenarios
5. **Monitoring**: Implement thorough monitoring and alerting

### For Users
1. **Preference Management**: Regularly review and update preferences
2. **Channel Selection**: Choose appropriate channels for different types
3. **Quiet Hours**: Set quiet hours to avoid disruption
4. **Feedback**: Provide feedback on notification relevance and timing

### For Administrators
1. **Template Maintenance**: Regularly update and improve templates
2. **Performance Monitoring**: Monitor system performance and capacity
3. **User Feedback**: Collect and act on user feedback
4. **Compliance**: Ensure ongoing compliance with regulations
5. **Security**: Regular security audits and updates

This comprehensive notification system ensures that all stakeholders stay informed throughout the entire collaboration lifecycle while respecting user preferences and maintaining high delivery standards.