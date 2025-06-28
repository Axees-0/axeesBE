# QR Code and Ghost Accounts Implementation

## Overview

This document describes the implementation of QR code generation and ghost (temporary) account functionality for the Axees backend.

## Architecture

### 1. Ghost Accounts
Ghost accounts are temporary user accounts that allow users to interact with the platform before creating a full account. They are designed to:
- Lower the barrier to entry for new users
- Track user behavior before registration
- Enable seamless conversion to full accounts
- Expire after 30 days if not converted

### 2. QR Codes
QR codes provide a quick way to share profiles, offers, deals, and campaigns. Features include:
- Dynamic QR code generation with customizable styling
- Short URL generation for tracking
- Scan analytics and tracking
- Integration with ghost accounts for non-authenticated users

## Files Created

### Routes

#### `/routes/ghostAccountRoutes.js`
- **POST /api/ghost-accounts** - Create a new ghost account
- **GET /api/ghost-accounts/:ghostId** - Get ghost account details
- **PUT /api/ghost-accounts/:ghostId/convert** - Convert ghost account to real user
- **DELETE /api/ghost-accounts/:ghostId** - Delete ghost account (admin only)
- **GET /api/ghost-accounts/analytics** - Get ghost account analytics (admin only)

#### `/routes/qrCodeRoutes.js`
- **POST /api/qr/generate** - Generate a new QR code
- **GET /api/qr/:qrCodeId** - Get QR code details
- **POST /api/qr/:qrCodeId/scan** - Track QR code scan
- **GET /api/qr/:qrCodeId/analytics** - Get QR code analytics
- **GET /api/qr/my-codes** - Get user's QR codes
- **DELETE /api/qr/:qrCodeId** - Delete QR code

### Controllers

#### `/controllers/ghostAccountController.js`
Handles all ghost account operations:
- Creates ghost accounts with unique IDs
- Tracks activities and conversions
- Manages expiration and cleanup
- Provides analytics on conversion rates

#### `/controllers/qrCodeController.js`
Manages QR code functionality:
- Generates QR codes using the `qrcode` library
- Creates trackable short URLs
- Records scan data and analytics
- Integrates with ghost accounts for unauthenticated users

### Models

#### `/models/GhostAccount.js`
Schema includes:
- Unique ghost ID
- Optional email and name
- Source tracking (QR code, direct link, social share)
- Activity tracking
- Conversion tracking
- Expiration management

#### `/models/QRCode.js`
Schema includes:
- QR code ID and type
- Target resource (profile, offer, deal, etc.)
- Customization options
- Scan tracking with user/device info
- Analytics data
- Campaign integration

## Usage Examples

### Creating a Ghost Account
```javascript
POST /api/ghost-accounts
{
  "email": "potential@customer.com",
  "name": "John Doe",
  "source": "qr_code",
  "metadata": {
    "campaignId": "summer-2024"
  }
}
```

### Generating a QR Code
```javascript
POST /api/qr/generate
{
  "type": "profile",
  "targetId": "user123",
  "options": {
    "size": 400,
    "color": "#1a73e8",
    "logo": true
  }
}
```

### Converting Ghost to Real Account
```javascript
PUT /api/ghost-accounts/ghost_123/convert
{
  "phone": "+1234567890",
  "password": "securePassword123",
  "userType": "Creator"
}
```

## Integration Points

### Frontend Integration
1. **QR Code Display**: Use the returned base64 or SVG data to display QR codes
2. **Ghost Account Token**: Store the ghost token in localStorage for tracking
3. **Conversion Flow**: Prompt ghost users to create full accounts after key actions

### Analytics Integration
- Track conversion funnels from QR scan → ghost account → registered user
- Monitor QR code performance across campaigns
- Analyze user behavior patterns before registration

## Security Considerations

1. **Token Security**: Ghost tokens expire after 30 days
2. **Rate Limiting**: Implement rate limiting on QR code generation
3. **Authorization**: Only QR code owners can view detailed analytics
4. **Data Privacy**: IP addresses and location data are stored securely

## Next Steps

1. **Install Dependencies**:
   ```bash
   npm install qrcode
   ```

2. **Run Database Migrations**: Create indexes for new collections

3. **Configure Environment Variables**:
   - `BASE_URL` - For short URL generation
   - `FRONTEND_URL` - For tracking URLs
   - `JWT_SECRET` - For token generation

4. **Test Implementation**:
   - Test QR code generation with different options
   - Verify ghost account creation and conversion
   - Check analytics data collection

## API Documentation

All endpoints are documented with Swagger annotations and will appear in the API documentation at `/api-docs`.