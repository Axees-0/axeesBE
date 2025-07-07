# Axees Frontend - Investor Demo

Clean frontend repository containing only the investor demo components and deployment system.

## Demo Components

### Core Discovery & Offers
- **Discover Page**: `/app/discover.tsx` - Advanced creator discovery with filtering (44K+ lines)
- **Offer Creation**: `/app/UOM02MarketerOfferDetail.tsx` - Complete offer management (64K+ lines)
- **Offer Flow**: `/offers/` - Full offer workflow (details, preview, counter, success)

### Analytics & Dashboard
- **Dashboard**: `/app/dashboard.tsx` - Main analytics dashboard
- **Deals Management**: `/app/deals.tsx` - Comprehensive deal tracking (35K+ lines)

### Demo Profiles
- **Sally Demo**: `/sally-demo.tsx` - Racing creator profile demo
- **Marcus Demo**: `/app/marcus-demo.tsx` - Desktop profile demo
- **Test Demos**: `/test-demo/` - MrBeast investor profile demo
- **Desktop Components**: `/desktop/` - Desktop-optimized profile views

## Quick Start

```bash
# Deploy to preview
npm run deploy

# Deploy to production  
npm run deploy:prod
```

## Demo URLs

- **Production**: https://polite-ganache-3a4e1b.netlify.app/sally-demo
- **Preview**: https://preview--polite-ganache-3a4e1b.netlify.app/sally-demo

## Deployment

This repository uses a DRY deployment system with centralized configuration. See `deployment.config.js` for all deployment settings.

---

**Generated with Claude Code for investor demo purposes.**