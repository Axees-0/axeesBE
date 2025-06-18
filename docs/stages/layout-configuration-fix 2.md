# Layout Configuration Fix Plan

## Problem Summary
The web version of the app lacks proper navigation structure, causing timeouts and routing failures. The native version works because it has Stack navigation, but web only has a bare `<Slot />`.

## Immediate Fix

### 1. Update _layout.web.tsx to include Stack navigation

The web layout needs the same navigation structure as native:

```tsx
// Add Stack import
import { Stack, Slot } from "expo-router";

// Replace bare <Slot /> with proper Stack navigation
<Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
  <Stack.Screen name="(tabs)" />
</Stack>
```

### 2. Fix Stream Handling Errors

The "Cannot pipe to closed stream" errors occur due to:
- Multiple concurrent Firebase listeners
- Unhandled promise rejections in notification handlers
- Service worker message listeners not properly cleaned up

Add error boundaries and proper cleanup:

```tsx
// Wrap async operations in try-catch
useEffect(() => {
  let unsubscribe: any;
  const setupMessaging = async () => {
    try {
      const messagingInstance = await messaging();
      if (!messagingInstance) return;
      
      unsubscribe = onMessage(messagingInstance, (payload) => {
        // Handle message
      });
    } catch (error) {
      console.error('Messaging setup failed:', error);
    }
  };
  
  setupMessaging();
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, []);
```

### 3. Consolidate Platform-Specific Code

Currently there are two separate layout files causing maintenance issues:
- Merge common functionality into shared components
- Use Platform.select() for platform-specific behavior
- Reduce code duplication

## Testing Strategy

1. Apply fixes incrementally
2. Test navigation to each major route
3. Monitor console for stream errors
4. Validate on both web and native platforms

## Success Criteria

- All pages load within 3 seconds
- No "Cannot pipe to closed stream" errors
- Navigation works consistently across platforms
- Authentication state persists during navigation