# Timeout Fix Instructions

## Problem
6/16 jobs failing due to hardcoded 5-second timeout in segmented-workflow-engine.ts line 528.

## Root Cause
```typescript
// BUG - Line 528 in segmented-workflow-engine.ts:
await page.waitForSelector(step.selector, { 
  visible: step.waitForVisible !== false,
  timeout: 5000  // ← This kills complex selectors
});
```

## Solution
Replace hardcoded timeout with adaptive timeout:

```typescript
// FIX:
const TimeoutManager = require('./timeout-manager');

await page.waitForSelector(step.selector, { 
  visible: step.waitForVisible !== false,
  timeout: TimeoutManager.getStepTimeout(step)  // ← Adaptive timeout
});
```

## Files Created
1. `timeout-manager.js` - Utility for adaptive timeouts
2. `test-timeout-fix.js` - Demonstrates the fix
3. `FIX_INSTRUCTIONS.md` - This file

## Test the Fix
```bash
node test-timeout-fix.js
```

## Expected Results
- Complex selectors get 15-30 seconds instead of 5 seconds
- 6 failing jobs should now pass
- 100% success rate instead of 62.5%

## Manual Fix
If you have access to the TypeScript source:

1. Open `src/segmentation/segmented-workflow-engine.ts`
2. Find line 528: `timeout: 5000`
3. Replace with: `timeout: step.timeout || 30000`
4. Recompile TypeScript

This addresses the core timeout hierarchy mismatch causing the failures.
