# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-06-30

### Code Quality - Duplicate Functionality Removal

#### Performance Utilities Consolidation
- **Removed**: `utils/performance.ts` (duplicate implementation)
- **Canonical**: `utils/performance.tsx`
- **Reason**: The .tsx file contained a more comprehensive implementation with additional features including:
  - Class-based architecture with proper TypeScript typing
  - Performance timing utilities with start/end tracking
  - React-specific performance measurement tools
  - Image optimization utilities
  - Both debounce and throttle implementations (vs only debounce in .ts)
- **Impact**: Unified performance monitoring approach across the application

#### Date Formatting Consolidation
- **Removed**: Duplicate `formatTime()` from `app/(tabs)/messages.tsx`
- **Removed**: Duplicate `formatTimestamp()` from `app/(tabs)/notifications.tsx`
- **Canonical**: New shared utility `utils/dateFormatters.ts`
- **Reason**: Both functions implemented nearly identical relative time formatting logic
- **Benefits**:
  - Single source of truth for date formatting
  - Consistent time display across the application
  - Configurable options for different use cases
  - Reduced code duplication (~30 lines removed)

#### AuthGuard Cleanup
- **Removed**: `components/AuthGuard.original.tsx` (backup file)
- **Canonical**: `components/AuthGuard.tsx`
- **Reason**: Backup file was no longer needed after successful refactoring
- **Impact**: Reduced confusion and potential for using outdated code

#### Validation Functions Cleanup
- **Removed**: `validateEmail()` from `utils/validationHelpers.ts`
- **Removed**: `isStrongPassword()` from `utils/validationHelpers.ts`
- **Canonical**: 
  - Email validation: `utils/emailNotificationService.ts` (comprehensive validation with typo detection)
  - Password validation: `utils/passwordValidation.ts` (detailed strength checking with user feedback)
- **Reason**: The removed functions were basic implementations while canonical versions provide:
  - Email: Domain validation, common typo detection, detailed error messages
  - Password: Individual requirement checking, strength scoring, user-friendly feedback
- **Impact**: More robust validation with better user experience

#### Deployment Scripts Consolidation
- **Removed**: 16 duplicate deployment scripts:
  - `auto-deploy.js`, `auto-netlify-deploy.js`
  - `deploy.sh`, `deploy-axees.sh`, `deploy-simple.sh`
  - `deploy-both-versions.sh`, `deploy-dual-correct.sh`, `deploy-final-dual.js`, `deploy-simple-dual.js`
  - `deploy-to-specific-site.js`, `deploy-via-api.sh`, `deploy-with-token.js`
  - `direct-deploy.js`, `direct-netlify-upload.js`, `force-netlify-deploy.js`
  - `simple-deploy.js`
- **Canonical**: `scripts/deployment/unified-deploy.js`
- **Enhancement**: Added automatic loading of `.env.local` and `.env` files for authentication
- **Benefits**:
  - Single deployment entry point with all functionality
  - Simplified authentication via `.env.local` (gitignored)
  - Consistent deployment behavior across all environments
  - Reduced maintenance burden (2000+ lines removed)
- **New Workflow**:
  1. Add `NETLIFY_AUTH_TOKEN=your-token` to `.env.local`
  2. Run `npm run deploy`

### Summary
This consolidation effort removed 5 major duplicate implementations:
- 4 code duplicates (performance, date formatting, validation, backups)
- 16 deployment scripts consolidated into one
- Total reduction: ~2,300 lines of code
- Improved consistency, maintainability, and developer experience

All changes were tested to ensure no regressions were introduced.