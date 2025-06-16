# Dual-Purpose QR Code System Documentation

## Overview
The Dual-Purpose QR Code System provides secure QR code generation and scanning for both user profiles and deal tracking. This system enables easy sharing of profile information and real-time deal status monitoring through QR codes.

## Key Features

### 1. User Profile QR Codes
- **Profile Sharing**: Generate QR codes for user profile sharing
- **Connection Requests**: QR codes for direct connection invitations
- **Contact Information**: QR codes for sharing contact details
- **Expiration Control**: Configurable expiration times for security
- **Purpose-Specific URLs**: Different actions based on QR code purpose

### 2. Deal Tracking QR Codes
- **Deal Status**: Real-time deal status through QR scanning
- **Payment Information**: Secure payment status for authorized users
- **Milestone Tracking**: Progress monitoring for milestone-based deals
- **Participant Access**: Different access levels based on user role
- **Audit Trail**: Complete scan history and generation logs

### 3. Security Features
- **Token-Based Verification**: Secure tokens for QR code validation
- **Expiration Management**: Automatic expiration for user profile QR codes
- **Access Control**: Role-based access for sensitive information
- **Scan Tracking**: Complete audit trail of QR code usage

## API Endpoints

### Generate User Profile QR Code
```
POST /api/qr/user/generate
```

**Request:**
```json
{
  "purpose": "profile",
  "expiresIn": 24
}
```

**Response:**
```json
{
  "success": true,
  "message": "User profile QR code generated successfully",
  "data": {
    "qrCode": {
      "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "buffer": "base64-encoded-qr-code-data",
      "apiUrl": "https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=...",
      "purpose": "profile",
      "expiresAt": "2024-01-22T10:00:00Z",
      "shareUrl": "https://app.axees.com/profile/64f7b8e8c123456789abcdef?token=abc123"
    },
    "user": {
      "id": "64f7b8e8c123456789abcdef",
      "userName": "johndoe",
      "userType": "Creator"
    }
  }
}
```

### Generate Deal QR Code
```
POST /api/qr/deal/:dealId/generate
```

**Request:**
```json
{
  "includePayment": true,
  "includeStatus": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deal QR code generated successfully",
  "data": {
    "qrCode": {
      "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "buffer": "base64-encoded-qr-code-data",
      "apiUrl": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...",
      "trackingUrl": "https://app.axees.com/deal/track/64f7b8e8c123456789abcdef?token=xyz789",
      "includesPayment": true,
      "includesStatus": true
    },
    "deal": {
      "id": "64f7b8e8c123456789abcdef",
      "dealNumber": "AX-2024-001",
      "dealName": "Instagram Campaign Q1",
      "status": "active",
      "creator": "creatoruser",
      "marketer": "marketeruser"
    }
  }
}
```

### Scan QR Code
```
POST /api/qr/scan
```

**Request:**
```json
{
  "qrData": "https://app.axees.com/profile/64f7b8e8c123456789abcdef?token=abc123",
  "token": "abc123"
}
```

**Response for User Profile:**
```json
{
  "success": true,
  "message": "User QR code verified successfully",
  "data": {
    "type": "user_profile",
    "user": {
      "id": "64f7b8e8c123456789abcdef",
      "userName": "johndoe",
      "email": "john@example.com",
      "userType": "Creator",
      "profilePicture": "https://...",
      "bio": "Content creator and influencer",
      "canConnect": true
    },
    "actions": {
      "viewProfile": "/api/users/64f7b8e8c123456789abcdef",
      "sendMessage": "/api/chats/initiate",
      "connect": "/api/users/connect/64f7b8e8c123456789abcdef"
    }
  }
}
```

**Response for Deal Tracking:**
```json
{
  "success": true,
  "message": "Deal QR code verified successfully",
  "data": {
    "type": "deal_tracking",
    "deal": {
      "id": "64f7b8e8c123456789abcdef",
      "dealNumber": "AX-2024-001",
      "dealName": "Instagram Campaign Q1",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z",
      "creator": {
        "id": "64f7b8e8c123456789abcdef",
        "userName": "creatoruser"
      },
      "marketer": {
        "id": "64f7b8e8c123456789abcdef",
        "userName": "marketeruser"
      },
      "payment": {
        "status": "Escrowed",
        "amount": 500,
        "escrowStatus": "held"
      },
      "milestones": [
        {
          "id": "64f7b8e8c123456789abcdef",
          "title": "Content Creation",
          "status": "active",
          "amount": 250,
          "dueDate": "2024-01-25T10:00:00Z"
        }
      ]
    },
    "actions": {
      "viewDetails": "/api/marketer/deals/64f7b8e8c123456789abcdef",
      "updateStatus": "/api/marketer/deals/64f7b8e8c123456789abcdef/status",
      "viewPayment": "/api/payments/deals/64f7b8e8c123456789abcdef"
    }
  }
}
```

### Get QR Code History
```
GET /api/qr/history
```

**Response:**
```json
{
  "success": true,
  "message": "QR code history retrieved successfully",
  "data": {
    "profile": {
      "lastGenerated": "2024-01-21T10:00:00Z",
      "purpose": "profile",
      "expiresAt": "2024-01-22T10:00:00Z",
      "isExpired": false
    },
    "deals": [
      {
        "dealId": "64f7b8e8c123456789abcdef",
        "dealNumber": "AX-2024-001",
        "dealName": "Instagram Campaign Q1",
        "generatedAt": "2024-01-21T09:30:00Z",
        "generatedBy": "64f7b8e8c123456789abcdef"
      }
    ]
  }
}
```

### Bulk Generate Deal QR Codes
```
POST /api/qr/bulk/deals
```

**Request:**
```json
{
  "dealIds": [
    "64f7b8e8c123456789abcdef",
    "64f7b8e8c123456789abcdeg"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk QR generation completed",
  "data": {
    "successful": 2,
    "failed": 0,
    "results": [
      {
        "dealId": "64f7b8e8c123456789abcdef",
        "dealNumber": "AX-2024-001",
        "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "apiUrl": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=...",
        "trackingUrl": "https://app.axees.com/deal/track/64f7b8e8c123456789abcdef?token=xyz789"
      }
    ],
    "errors": []
  }
}
```

## Database Schema Updates

### User Model Enhancement
```javascript
// Added to User schema
qrCodeData: {
  lastGenerated: { type: Date },
  purpose: { 
    type: String, 
    enum: ["profile", "connect", "contact"],
    default: "profile"
  },
  expiresAt: { type: Date },
  token: { type: String, select: false }, // Not returned by default for security
  usageCount: { type: Number, default: 0 }
}
```

### Deal Model Enhancement
```javascript
// Added to Deal schema
qrCodeData: {
  lastGenerated: { type: Date },
  generatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  token: { type: String, select: false }, // Security token, not returned by default
  scanCount: { type: Number, default: 0 },
  lastScanned: { type: Date }
}
```

## QR Code URL Formats

### User Profile URLs
- **Profile View**: `{FRONTEND_URL}/profile/{userId}?token={token}`
- **Connection Request**: `{FRONTEND_URL}/connect/{userId}?token={token}`
- **Contact Information**: `{FRONTEND_URL}/contact/{userId}?token={token}`

### Deal Tracking URLs
- **Deal Tracking**: `{FRONTEND_URL}/deal/track/{dealId}?token={token}`

## Security Implementation

### Token Generation
```javascript
const generateSecureToken = (data) => {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));
  hash.update(process.env.QR_CODE_SECRET || 'default-qr-secret');
  return hash.digest('hex').substring(0, 16);
};
```

### Environment Variables
```env
# Required for QR code security
QR_CODE_SECRET=your-secure-qr-code-secret-key
FRONTEND_URL=https://app.axees.com
```

### Security Best Practices
1. **Token Verification**: All QR codes include secure tokens for validation
2. **Expiration Control**: User profile QR codes have configurable expiration
3. **Access Control**: Deal QR codes respect user permissions
4. **Audit Logging**: All QR code generation and scanning is logged
5. **Rate Limiting**: Prevent abuse of QR code generation endpoints

## Use Cases

### 1. Business Cards & Networking
- **Creator Profiles**: Generate QR codes for business cards
- **Event Networking**: Quick profile sharing at industry events
- **Contact Exchange**: Instant contact information sharing

### 2. Deal Management
- **Client Updates**: Share deal progress with clients
- **Team Collaboration**: Quick access to deal information
- **Payment Verification**: Secure payment status checking

### 3. Mobile App Integration
- **Camera Scanning**: Native QR code scanning in mobile app
- **Deep Linking**: Direct navigation to relevant app screens
- **Offline Access**: QR codes work without internet for basic info

## Frontend Integration

### QR Code Generation
```javascript
// Generate user profile QR code
const generateProfileQR = async (purpose = 'profile', expiresIn = 24) => {
  const response = await fetch('/api/qr/user/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ purpose, expiresIn })
  });
  
  const data = await response.json();
  return data.data.qrCode.apiUrl; // Use this URL to display QR code
};

// Generate deal QR code
const generateDealQR = async (dealId, includePayment = false) => {
  const response = await fetch(`/api/qr/deal/${dealId}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ includePayment, includeStatus: true })
  });
  
  const data = await response.json();
  return data.data.qrCode.apiUrl;
};
```

### QR Code Scanning
```javascript
// Scan QR code
const scanQRCode = async (qrData, token) => {
  const response = await fetch('/api/qr/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ qrData, token })
  });
  
  const data = await response.json();
  
  if (data.success) {
    if (data.data.type === 'user_profile') {
      // Handle user profile
      showUserProfile(data.data.user);
    } else if (data.data.type === 'deal_tracking') {
      // Handle deal tracking
      showDealDetails(data.data.deal);
    }
  }
};
```

## Error Handling

### Common Error Scenarios
1. **Expired QR Code**: User profile QR codes past expiration
2. **Invalid Token**: Tampered or incorrect security tokens
3. **Unauthorized Access**: Non-participants scanning deal QR codes
4. **Missing Resources**: Deleted users or deals
5. **Rate Limiting**: Too many QR generation requests

### Error Response Format
```json
{
  "success": false,
  "error": "QR code has expired",
  "code": 401,
  "details": {
    "type": "expiration_error",
    "expiresAt": "2024-01-21T10:00:00Z",
    "suggestion": "Generate a new QR code"
  }
}
```

## Best Practices

### For Implementation
1. **QR Code Library**: Install proper QR code library (`npm install qrcode`)
2. **Image Optimization**: Use appropriate sizes for different use cases
3. **Caching**: Cache generated QR codes to reduce server load
4. **Mobile Optimization**: Ensure QR codes work well on mobile devices
5. **Analytics**: Track QR code usage for insights

### For Users
1. **Expiration Awareness**: Check QR code expiration before sharing
2. **Purpose Clarity**: Use appropriate QR code purposes
3. **Security Consciousness**: Don't share sensitive deal QR codes publicly
4. **Regular Updates**: Regenerate QR codes periodically for security

### For Maintenance
1. **Token Rotation**: Regular secret key rotation
2. **Cleanup Jobs**: Remove expired QR code data
3. **Performance Monitoring**: Track QR generation performance
4. **Usage Analytics**: Monitor QR code scan patterns

## Monitoring & Analytics

### Key Metrics
- QR code generation frequency
- Scan success rate
- Expiration utilization
- Most popular QR purposes
- Deal QR usage patterns

### Alert Triggers
- High failure rate for QR generation
- Unusual scanning patterns
- Token validation failures
- Performance degradation

## Future Enhancements

1. **Dynamic QR Codes**: Update content without regenerating
2. **Custom Branding**: Brand-specific QR code styling
3. **Analytics Dashboard**: Detailed QR code usage analytics
4. **Batch Operations**: Bulk QR code management
5. **Integration APIs**: Third-party QR code integrations
6. **Advanced Security**: Biometric verification for sensitive QR codes
7. **Geolocation**: Location-based QR code features

## Testing Scenarios

### User Profile QR Codes
1. Generate QR code with different purposes
2. Test expiration functionality
3. Verify token validation
4. Test scanning by different users
5. Check unauthorized access handling

### Deal QR Codes
1. Generate QR codes for different deal statuses
2. Test participant vs non-participant access
3. Verify payment information inclusion
4. Test bulk generation functionality
5. Check audit trail accuracy

### Security Testing
1. Token tampering attempts
2. Expired QR code handling
3. Rate limiting verification
4. Access control testing
5. Data exposure checks

This dual-purpose QR code system provides a secure, flexible solution for profile sharing and deal tracking, enhancing user experience while maintaining security standards.