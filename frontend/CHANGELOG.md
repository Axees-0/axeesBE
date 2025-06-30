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

### Summary
This consolidation effort removed 4 duplicate implementations, reducing the codebase by approximately 300 lines while improving consistency and maintainability. All changes were tested to ensure no regressions were introduced.