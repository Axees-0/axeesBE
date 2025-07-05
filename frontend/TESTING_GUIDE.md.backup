# Axees Frontend Testing Guide

## 🎯 Overview
This guide provides step-by-step instructions for validating all features after the branch integration. The `dev` branch now contains all features from the previous branches.

## 🔗 Deployment URL
- Preview: https://axees-preview.netlify.app
- Main: https://polite-ganache-3a4e1b.netlify.app

## ✅ Test Checklist

### 1. Debug Panel Validation
**Purpose**: Ensure the debug panel is visible and functional

#### Steps:
1. Navigate to the Discover page (main tab)
2. Look for the debug panel in the **bottom left corner**
3. Verify the panel displays:
   - Black background with white text
   - Title: "🐛 Context Debug Panel"
   - Clear and Hide buttons
   - Log entries with timestamps

#### Expected Results:
- [ ] Debug panel appears **above** the navigation bar (z-index: 9999)
- [ ] Panel shows context initialization logs
- [ ] Clear button removes all logs
- [ ] Hide button minimizes to small indicator
- [ ] Click on minimized indicator restores full panel

### 2. Filter Buttons Functionality
**Purpose**: Verify all filter interactions work correctly

#### Steps:
1. On Discover page, test each filter tab:
   - **Filters Tab** (blue icon)
   - **Location Tab** (black icon)
   - **Demographic Tab** (green icon)
   - **Category Tab** (red icon)

2. For each tab:
   - Click to expand filter section
   - Make selections
   - Watch debug panel for logs
   - Verify UI updates

#### Expected Results:
- [ ] Each tab toggles its section open/closed
- [ ] Active tab shows highlighted state
- [ ] Debug logs show: `✅ Real updateFilter called: [filter] = [value]`
- [ ] Filter selections persist when switching tabs
- [ ] Creator list updates based on filters

### 3. All 5 Navigation Tabs
**Purpose**: Ensure navigation works correctly

#### Steps:
1. Test each bottom navigation tab:
   - **Explore** (home icon)
   - **Deals/Offers** (tag icon)
   - **Messages** (message icon)
   - **Notifications** (bell icon)
   - **Dashboard** (menu icon)

#### Expected Results:
- [ ] Each tab navigates to correct screen
- [ ] Active tab shows visual indicator
- [ ] No console errors during navigation
- [ ] Debug panel persists across navigation

### 4. Profile Features (Phase 3)
**Purpose**: Validate enhanced profile functionality

#### Steps:
1. From Discover page, click on any creator card
2. On profile page, verify:
   - Profile header with avatar and stats
   - Platform-specific metrics
   - Audience insights section
   - Content examples
   - Contact/Book button

#### Expected Results:
- [ ] Profile loads without errors
- [ ] All sections display data
- [ ] Back navigation works
- [ ] Responsive layout on different screen sizes

### 5. Search Functionality
**Purpose**: Test search and filtering combination

#### Steps:
1. On Discover page, use search bar
2. Type creator names, locations, or categories
3. Combine with filters
4. Clear search

#### Expected Results:
- [ ] Search updates results in real-time
- [ ] X button clears search
- [ ] Results show match count
- [ ] Search works with filters active

### 6. Performance Tests
**Purpose**: Ensure smooth performance

#### Steps:
1. Scroll through creator list
2. Rapidly toggle filters
3. Navigate between tabs quickly
4. Long press creator cards for selection

#### Expected Results:
- [ ] Smooth scrolling (60 FPS)
- [ ] No lag when filtering
- [ ] No memory leaks in debug panel
- [ ] Selection state persists correctly

## 🐛 Debug Panel Log Reference

### Successful Operations:
- `🔴 DiscoveryFilterProvider function called` - Provider initializing
- `🔴 useState initialized successfully` - State setup complete
- `✅ Real updateFilter called` - Filter update working
- `✅ Context available, returning real functions` - Hook connected

### Warning Signs:
- `❌ CONTEXT UNAVAILABLE` - Provider not in tree
- `🚫 FALLBACK updateFilter called` - Using fallback (no effect)
- `🟡 useDiscoveryFilters called, context available: false` - Temporary state

## 📱 Mobile Web Testing
1. Open Chrome DevTools
2. Toggle device toolbar
3. Test on:
   - iPhone 12 Pro
   - Samsung Galaxy S20
   - iPad Air

## 🔍 Console Monitoring
Keep console open and watch for:
- No React warnings about keys
- No "Can't perform state update" errors
- No network errors (404s, etc.)

## 📋 Regression Tests
Ensure these existing features still work:
- [ ] User authentication (if logged in)
- [ ] Data persistence across refreshes
- [ ] Responsive design breakpoints
- [ ] Image lazy loading
- [ ] Platform icon display

## 🚀 Performance Metrics
Using Chrome DevTools:
1. Open Performance tab
2. Record while:
   - Filtering creators
   - Scrolling list
   - Navigating tabs
3. Check for:
   - FPS staying above 50
   - No major garbage collection
   - React renders under 16ms

## 📝 Bug Report Template
If you find issues:
```
**Issue**: [Brief description]
**Steps to Reproduce**:
1. 
2. 
**Expected**: 
**Actual**: 
**Debug Logs**: [Copy relevant logs]
**Browser/Device**: 
```

## ✨ Success Criteria
All tests pass when:
1. Debug panel visible above all elements
2. All filters update the creator list
3. Navigation works without errors
4. Profile pages load completely
5. Performance stays smooth
6. No console errors or warnings

---

Last Updated: 2025-01-04
Branch: dev (formerly galaxies-features-implementation)