# Frontend Pages to Backend API File Mapping

This document provides a comprehensive mapping between frontend pages and their corresponding backend API endpoints and file locations.

## Project Structure
- **Frontend Location:** `/home/Mike/projects/axees/axeesBE/frontend/app/`
- **Backend Location:** `/home/Mike/projects/axees/axeesBE/`
- **API Base URL:** All backend routes are prefixed with `/api/`
- **Server Port:** 3001 (or from PORT environment variable)

## Frontend Pages → Backend API File Locations

### **Authentication System**
**Frontend Pages:**
- `/app/login.tsx` → Login page
- `/app/register.tsx` → Registration start
- `/app/register-phone.tsx` → Phone registration
- `/app/register-otp.tsx` → OTP verification
- `/app/register-details.tsx` → Profile details
- `/app/register-success.tsx` → Success page
- `/app/forgot-password.tsx` → Password reset
- `/app/reset-password.tsx` → New password
- `/app/reset-password-otp.tsx` → Reset OTP

**Backend Files:**
- **Routes:** `/routes/auth.js`
- **Controller:** `/controllers/accountController.js`
- **Key Endpoints:**
  - `POST /api/auth/login` - User login
  - `POST /api/auth/register/start` - Start registration (send OTP)
  - `POST /api/auth/register/verify-otp` - Verify OTP
  - `POST /api/auth/register/verify-reset-otp` - Verify reset OTP
  - `POST /api/auth/resend-otp` - Resend OTP
  - `GET /api/auth/check-phone` - Check if phone exists
  - `POST /api/auth/password-reset` - Start password reset

### **User Account Management**
**Frontend Pages:**
- `/app/profile.tsx` → User profile (tab)
- `/app/profile/[id].tsx` → Specific user profile

**Backend Files:**
- **Routes:** `/routes/account.js`, `/routes/users.js`
- **Controllers:** `/controllers/accountController.js`, `/controllers/usersController.js`
- **Key Endpoints:**
  - **Account Routes:**
    - `POST /api/account/register/set-profile` - Set profile details
    - `POST /api/account/update-name` - Update user name
    - `POST /api/account/update-username` - Update username
    - `POST /api/account/set-email` - Set email
    - `POST /api/account/set-password` - Set password
    - `PUT /api/account/profile/:userId` - Update profile
    - `GET /api/account/profile/:userId` - Get profile
    - `PATCH /api/account/creator/:userId` - Update creator data
  
  - **User Routes:**
    - `GET /api/users` - Get all users
    - `GET /api/users/:userId` - Get user by ID
    - `PUT /api/users/:userId` - Update user
    - `PATCH /api/users/:userId` - Partial update
    - `PATCH /api/users/:userId/favorites` - Toggle favorite
    - `PATCH /api/users/:viewerId/hide` - Hide creator

### **Offers Management**
**Frontend Pages:**
- `/app/offers/premade.tsx` → Pre-made offers
- `/app/offers/custom.tsx` → Custom offers
- `/app/offers/details.tsx` → Offer details
- `/app/offers/preview.tsx` → Preview offer
- `/app/offers/review.tsx` → Review offer
- `/app/offers/counter.tsx` → Counter offer
- `/app/offers/handle-counter.tsx` → Handle counter
- `/app/offers/success.tsx` → Success page

**Backend Files:**
- **Routes:** `/routes/marketerOfferRoutes.js`
- **Controller:** `/controllers/marketerOfferController.js`
- **Key Endpoints:**
  - `POST /api/marketer/offers` - Create offer
  - `GET /api/marketer/offers` - Get offers
  - `GET /api/marketer/offers/:offerId` - Get offer by ID
  - `PUT /api/marketer/offers/:offerId` - Update offer
  - `DELETE /api/marketer/offers/:offerId` - Delete offer
  - `POST /api/marketer/offers/:offerId/send` - Send offer
  - `POST /api/marketer/offers/:offerId/accept` - Accept offer
  - `POST /api/marketer/offers/:offerId/reject` - Reject offer

### **Deals Management**
**Frontend Pages:**
- `/app/deals.tsx` → Deals list (tab)
- `/app/deals/[id].tsx` → Deal details
- `/app/deals/proof.tsx` → Proof submission
- `/app/deals/submit.tsx` → Submit deal

**Backend Files:**
- **Routes:** `/routes/marketerDealRoutes.js`
- **Controller:** `/controllers/marketerDealController.js`
- **Key Endpoints:**
  - `POST /api/marketer/deals/:dealId/milestones` - Add milestone
  - `GET /api/marketer/deals/:dealId/milestones` - List milestones
  - `GET /api/marketer/deals/:dealId/milestones/:milestoneId` - Get milestone
  - `POST /api/marketer/deals/:dealId/offer-content` - Submit content

### **Messaging & Chat**
**Frontend Pages:**
- `/app/messages.tsx` → Messages list (tab)
- `/app/chat/[id].tsx` → Chat conversation

**Backend Files:**
- **Routes:** `/routes/chat.js` (direct implementation, no separate controller)
- **Key Endpoints:**
  - `GET /api/chats` - Get all chats
  - `POST /api/chats/:chatId/messages` - Send message
  - `GET /api/chats/:chatId/messages` - Get messages
  - `POST /api/chats/messages/:id/read` - Mark as read
  - `PATCH /api/chats/messages/:id` - Update message
  - `DELETE /api/chats/messages/:id` - Delete message
  - `GET /api/chats/:chatId/stream` - SSE stream
  - `GET /api/chats/search` - Search messages

### **Discovery & Search**
**Frontend Pages:**
- `/app/discover.tsx` → Discover creators
- `/app/index.tsx` → Home/Explore (tab)

**Backend Files:**
- **Routes:** `/routes/findRoutes.js`
- **Controller:** `/controllers/findController.js`
- **Key Endpoints:**
  - `GET /api/find` - Search creators
  - `POST /api/find/refresh` - Manual refresh

### **Payments & Earnings**
**Frontend Pages:**
- `/app/payments/index.tsx` → Payments overview
- `/app/payments/creator.tsx` → Creator payments
- `/app/payments/marketer.tsx` → Marketer payments
- `/app/payment/instant.tsx` → Instant payment
- `/app/earnings/index.tsx` → Earnings overview
- `/app/earnings/withdraw.tsx` → Withdraw funds

**Backend Files:**
- **Routes:** `/routes/paymentRoutes.js`, `/routes/earningsRoutes.js`
- **Controllers:** `/controllers/paymentController.js`, `/controllers/earningsController.js`
- **Key Endpoints:**
  - **Payment Routes:**
    - `GET /api/payments/session-status` - Get session status
    - `POST /api/payments/paymentmethod` - Add payment method
    - `POST /api/payments/withdraw` - Withdraw money
    - `GET /api/payments/withdrawals/history` - Withdrawal history
    - `GET /api/payments/withdrawal/:withdrawalId` - Get withdrawal
    - `POST /api/payments/payouts` - Request payout
    - `GET /api/payments/earnings` - Get earnings
    - `POST /api/payments/refund` - Create refund
    - `POST /api/payments/webhook` - Stripe webhook (raw body)

  - **Earnings Routes:**
    - `GET /api/earnings/withdraw/limits` - Get withdrawal limits
    - `GET /api/earnings/analytics` - Get earnings analytics
    - `GET /api/earnings/transactions` - Get transaction history

### **Notifications**
**Frontend Pages:**
- `/app/notifications.tsx` → Notifications (tab)
- `/app/notifications/center.tsx` → Notification center

**Backend Files:**
- **Routes:** `/routes/notifications.js` (direct implementation)
- **Key Endpoints:**
  - `GET /api/notifications` - Get notifications
  - `POST /api/notifications/mark-read` - Mark as read
  - `DELETE /api/notifications` - Delete notifications

### **QR Code Features**
**Frontend Pages:**
- `/app/qr/scan.tsx` → QR scanner

**Backend Files:**
- **Routes:** `/routes/qrCodeRoutes.js`
- **Controller:** `/controllers/qrCodeController.js`
- **Key Endpoints:**
  - `POST /api/qr/generate` - Generate QR code
  - `GET /api/qr/:qrCodeId` - Get QR code
  - `POST /api/qr/:qrCodeId/scan` - Track scan
  - `GET /api/qr/:qrCodeId/analytics` - Get analytics
  - `GET /api/qr/my-codes` - Get user's QR codes
  - `DELETE /api/qr/:qrCodeId` - Delete QR code

### **Ghost Accounts**
**Frontend Pages:**
- `/app/ghost-profile/create.tsx` → Create ghost profile

**Backend Files:**
- **Routes:** `/routes/ghostAccountRoutes.js`
- **Controller:** `/controllers/ghostAccountController.js`
- **Key Endpoints:**
  - `POST /api/ghost-accounts` - Create ghost account
  - `GET /api/ghost-accounts/:ghostId` - Get ghost account
  - `PUT /api/ghost-accounts/:ghostId/convert` - Convert to real account
  - `DELETE /api/ghost-accounts/:ghostId` - Delete ghost account
  - `GET /api/ghost-accounts/analytics` - Get analytics

### **Other Features**
**Frontend Pages:**
- `/app/analytics.tsx` → Analytics dashboard
- `/app/campaigns.tsx` → Campaigns list
- `/app/campaigns/create.tsx` → Create campaign
- `/app/network.tsx` → Network view
- `/app/creative.tsx` → Creative content
- `/app/milestones/setup.tsx` → Setup milestones

**Backend Files:**
- **Invite System:**
  - **Routes:** `/routes/inviteRoutes.js`
  - **Controller:** `/controllers/inviteController.js`
  - **Endpoints:**
    - `POST /api/invite/create` - Create invite
    - `GET /api/invite/my-invites` - Get invites
    - `GET /api/invite/status/:inviteToken` - Get invite status
    - `POST /api/invite/accept` - Accept invite
    - `DELETE /api/invite/:inviteId` - Delete invite

- **Connect System:**
  - **Routes:** `/routes/connectRoutes.js`
  - **Controller:** `/controllers/connectController.js`
  - **Endpoints:**
    - `POST /api/connect/onboard` - Onboard connect account
    - `GET /api/connect/verify/:connectId` - Verify connect account

## Additional Route Files Referenced in main.js
These routes are referenced in main.js but may need to be created:

- `/api/negotiation` - Negotiation routes
- `/api/profile-completion` - Profile completion routes
- `/api/trial-offers` - Trial offer routes
- `/api/payment-persistence` - Payment persistence routes
- `/api/milestone-payments` - Milestone payment routes
- `/api/auto-releases` - Automatic payment release routes
- `/api/offer-notifications` - Offer status notification routes
- `/api/contextual-communication` - Contextual communication routes
- `/api/agreements` - Agreement display routes
- `/api/admin/dashboard` - Admin dashboard routes
- `/api/profile` - Profile routes
- `/api/calendar` - Calendar routes
- `/api/social-media` - Social media routes
- `/api/proof-submissions` - Proof submission routes
- `/api/deal-dashboard` - Deal dashboard routes
- `/api/payment-autopop` - Payment auto-population routes
- `/api/offers` - Offer collaboration routes
- `/api/deals` - Dispute resolution routes

## Main Backend Configuration
- **Entry Point:** `/main.js` - Express server configuration, middleware setup, and route mounting
- **Database:** MongoDB connection via `/utils/db.js`
- **Middleware:** Authentication, CORS, body parsing, etc.
- **Static Files:** Served from `/public` directory

## Notes
1. All API routes are mounted with the `/api` prefix in the main Express application
2. Some routes implement logic directly in the route file without a separate controller
3. Authentication is handled via JWT tokens and middleware
4. The backend uses Express.js framework with MongoDB database
5. Real-time features use Server-Sent Events (SSE) for chat functionality

---
*Last Updated: June 28, 2025*