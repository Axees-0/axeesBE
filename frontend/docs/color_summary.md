# Color Usage Analysis Summary

## Overview
Found 63 TSX/JSX files in the frontend/app directory that need color updates.

## Categories of Pages

### 1. Authentication Pages
- **(Registeration)/UAM001Login.tsx**
  - Uses: #FFFFFF, #6C6C6C, #430B92, #000000, #FF0000, #F4F4F4
  - Needs: Replace with BrandColors.neutral and BrandColors.primary
  
- **forgot-password.tsx**
- **reset-password-otp.tsx**
- **reset-password.tsx**
- **register.tsx**
- **register-details.tsx**
- **register-otp.tsx**
- **register-phone.tsx**
- **register-success.tsx**
- **login.tsx**

### 2. Tab Layout Pages
- **(tabs)/_layout.tsx, _layout.native.tsx, _layout.web.tsx**
  - Uses: #430B92 for backgroundColor
  - Needs: Replace with BrandColors.primary[500]

### 3. Main Tab Pages
- **(tabs)/deals.tsx**
  - Uses: Status colors (#FFA726, #66BB6A, #42A5F5, #4CAF50, #EF5350, #757575)
  - Uses: #FFFFFF, #FFF7ED, #FED7AA, #EA580C, #FEF3C7, #F59E0B
  - Needs: Replace with BrandColors.semantic colors

- **(tabs)/messages.tsx**
  - Uses: #f8f9fa, #666, #333, #000, #fff, #999
  - Needs: Replace with BrandColors.neutral palette

- **(tabs)/notifications.tsx**
  - Uses: Type colors (#7C3AED, #3B82F6, #10B981, #F59E0B, #6B7280)
  - Uses: #fff, #f3f4f6, #f0f0f0, #999, #f8f9fa, #333, #666
  - Needs: Replace with BrandColors.semantic and neutral

- **(tabs)/profile.tsx**
  - Uses: #f8f9fa, #000, #333, #666, #E8D5FE, #FFD700
  - Needs: Replace with BrandColors.neutral and primary

### 4. Offer/Deal Pages
- **UOM003MarketerSuccessMessage.tsx**
  - Uses: #FFFFFF, #000000, #430b92, #6C6C6C
  - Needs: BrandColors updates

- **UOM02MarketerOfferDetail.tsx**
  - Uses: #E2D0FB, #000, #f0f0f0, #430B92
  - Needs: BrandColors.primary light shades

- **UOM10CreatorOfferDetails.tsx**
  - Uses: #430B92, #FFFFFF, #000000, #F6F6F6, #6C6C6C, #F0E7FD
  - Needs: BrandColors updates

- **UOM14OfferAcceptSuccess.tsx**
  - Uses: #4CAF50, #FFFFFF, #6C6C6C, #430b92
  - Needs: BrandColors.semantic.success

- **offers/** directory pages (counter, custom, details, handle-counter, premade, preview, review, success)
  - Need systematic color replacement

### 5. Analytics & Dashboard Pages
- **analytics.tsx**
  - Uses: LinearGradient with custom colors
  - Platform colors: #E1306C, #000000, #FF0000, #1DA1F2
  - Gradient colors: ['#3B82F6', '#2563EB'], ['#10B981', '#059669'], ['#F59E0B', '#D97706']
  - Needs: Use BrandColors.social for platforms, BrandColors gradients

- **campaigns.tsx & campaigns/create.tsx**
  - Uses: Status colors (#10B981, #F59E0B, #6B7280)
  - Uses: #FFFFFF, #111827, #F9FAFB, #E5E7EB, #430B92
  - Needs: BrandColors.semantic and neutral

### 6. Creative & Content Pages
- **creative.tsx**
  - Uses: LinearGradient
  - Tool colors: #EDE9FE, #F3E8FF, #DBEAFE, #D1FAE5, #FEF3C7, #FCE7F3, #E0E7FF
  - Icon colors: #430B92, #8B5CF6, #3B82F6, #10B981, #F59E0B
  - Needs: Use BrandColors.primary shades

- **channel/[id].tsx**
  - Uses: LinearGradient
  - Uses: #fff, #666, #333, #000
  - Needs: BrandColors.neutral

### 7. Chat & Messaging Pages
- **chat/[id].tsx**
  - Uses: #fff, #f0f0f0, #10B981, #999, #666, #000
  - Needs: BrandColors.neutral and semantic

### 8. Payment & Earnings Pages
- **earnings/index.tsx & earnings/withdraw.tsx**
- **payments/creator.tsx, payments/index.tsx, payments/marketer.tsx**
- **payment/instant.tsx**
  - Need color analysis and updates

### 9. Other Pages
- **ghost-profile/create.tsx**
- **milestones/setup.tsx**
- **network.tsx**
- **qr/scan.tsx**
- **discover.tsx**

## Common Color Patterns to Replace

1. **Hardcoded Primary**: #430B92 → BrandColors.primary[500]
2. **White**: #FFFFFF → BrandColors.neutral[0]
3. **Black**: #000000 → BrandColors.neutral[1000]
4. **Grays**: 
   - #6C6C6C → BrandColors.neutral[500]
   - #666 → BrandColors.neutral[500]
   - #999 → BrandColors.neutral[400]
   - #333 → BrandColors.neutral[800]
   - #f0f0f0 → BrandColors.neutral[100]
   - #f8f9fa → BrandColors.neutral[50]

5. **Status Colors**:
   - Success: #4CAF50, #10B981 → BrandColors.semantic.success
   - Error: #FF0000, #EF4444 → BrandColors.semantic.error
   - Warning: #FFA726, #F59E0B → BrandColors.semantic.warning
   - Info: #3B82F6 → BrandColors.semantic.info

6. **LinearGradient**: Should use BrandColors arrays for consistency

## Priority Updates

1. **High Priority** (Most visible):
   - Tab layouts
   - Main tab pages (deals, messages, notifications, profile)
   - Authentication pages

2. **Medium Priority**:
   - Offer/deal flow pages
   - Analytics & campaigns
   - Chat/messaging

3. **Low Priority**:
   - Settings pages
   - Less frequently accessed pages