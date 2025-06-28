# Keyboard Navigation Fix for "Mark All Read" Button

## Issue
The "Mark all read" button in the notifications pages could not be focused via keyboard navigation, making it inaccessible to keyboard users.

## Files Modified
1. `/app/notifications/center.tsx`
2. `/app/(tabs)/notifications.tsx`

## Changes Made

### 1. Added Focus State Management
- Added `markAllFocused` state variable to track keyboard focus
- Added `setMarkAllFocused` function to update focus state

### 2. Enhanced TouchableOpacity Component
- Added `onFocus` handler to set focus state to true
- Added `onBlur` handler to set focus state to false
- Added `tabIndex={0}` for web platform to ensure keyboard focusability
- Applied focus styles when `markAllFocused` is true

### 3. Added Focus Styles
- Created `markAllButtonFocused` style that applies the global `Focus.primary` styles
- Added light purple background color for better visibility
- Created `markAllTextFocused` style for darker text color when focused
- Focus indicator includes:
  - 2px solid purple border (#430b92)
  - Purple shadow with 30% opacity
  - 4px shadow radius for better visibility
  - Light purple background (#f0e7fd)

### 4. Code Example
```jsx
<TouchableOpacity 
  style={[
    styles.markAllButton,
    markAllHovered && isWeb && styles.markAllButtonHovered,
    markAllFocused && styles.markAllButtonFocused,  // New focus style
    markingAllRead && styles.markAllButtonLoading
  ]}
  onFocus={() => setMarkAllFocused(true)}  // New handler
  onBlur={() => setMarkAllFocused(false)}   // New handler
  {...(Platform.OS === 'web' && { tabIndex: 0 })}  // Ensure focusable
>
```

## Benefits
1. **Accessibility**: Keyboard users can now navigate to and activate the "Mark all read" button
2. **WCAG Compliance**: Meets WCAG 2.1 guidelines for focus indicators
3. **Consistency**: Uses the global Focus styles defined in GlobalStyles.ts
4. **Visual Feedback**: Clear visual indication when the button is focused

## Testing
1. Navigate to the notifications page
2. Press Tab to move focus through the page
3. The "Mark all read" button should show a clear purple focus indicator
4. Press Enter or Space while focused to activate the button

## Notes
- The focus styles are consistent with other focusable elements in the app
- The implementation works on both web and native platforms
- No breaking changes to existing functionality