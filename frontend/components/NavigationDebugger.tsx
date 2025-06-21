import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { usePathname, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { metrics } from '@/utils/metrics';

interface NavEvent {
  id: string;
  timestamp: number;
  type: 'push' | 'replace' | 'back' | 'setParams' | 'navigate' | 'state-change';
  from: string;
  to: string;
  params?: any;
  stack: string;
  segments: string[];
}

const NavigationDebugger: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const insets = useSafeAreaInsets();
  
  const [events, setEvents] = React.useState<NavEvent[]>([]);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const previousPathname = useRef(pathname);
  const eventIdCounter = useRef(0);
  
  // Override router methods to track navigation
  useEffect(() => {
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalBack = router.back;
    const originalSetParams = router.setParams;
    
    router.push = function(...args: any[]) {
      const event: NavEvent = {
        id: `nav-${++eventIdCounter.current}`,
        timestamp: Date.now(),
        type: 'push',
        from: pathname,
        to: typeof args[0] === 'string' ? args[0] : args[0]?.pathname || 'unknown',
        params: typeof args[0] === 'object' ? args[0]?.params : args[1],
        stack: new Error().stack?.split('\n').slice(2, 5).join('\n') || '',
        segments: segments
      };
      
      setEvents(prev => [...prev.slice(-19), event]);
      
      return originalPush.apply(this, args);
    };
    
    router.replace = function(...args: any[]) {
      const event: NavEvent = {
        id: `nav-${++eventIdCounter.current}`,
        timestamp: Date.now(),
        type: 'replace',
        from: pathname,
        to: typeof args[0] === 'string' ? args[0] : args[0]?.pathname || 'unknown',
        params: typeof args[0] === 'object' ? args[0]?.params : args[1],
        stack: new Error().stack?.split('\n').slice(2, 5).join('\n') || '',
        segments: segments
      };
      
      setEvents(prev => [...prev.slice(-19), event]);
      
      return originalReplace.apply(this, args);
    };
    
    router.back = function() {
      const event: NavEvent = {
        id: `nav-${++eventIdCounter.current}`,
        timestamp: Date.now(),
        type: 'back',
        from: pathname,
        to: 'previous',
        stack: new Error().stack?.split('\n').slice(2, 5).join('\n') || '',
        segments: segments
      };
      
      setEvents(prev => [...prev.slice(-19), event]);
      
      return originalBack.apply(this);
    };
    
    router.setParams = function(...args: any[]) {
      const event: NavEvent = {
        id: `nav-${++eventIdCounter.current}`,
        timestamp: Date.now(),
        type: 'setParams',
        from: pathname,
        to: pathname,
        params: args[0],
        stack: new Error().stack?.split('\n').slice(2, 5).join('\n') || '',
        segments: segments
      };
      
      setEvents(prev => [...prev.slice(-19), event]);
      
      return originalSetParams.apply(this, args);
    };
    
    // Cleanup
    return () => {
      router.push = originalPush;
      router.replace = originalReplace;
      router.back = originalBack;
      router.setParams = originalSetParams;
    };
  }, [pathname, router, segments]);
  
  // Track pathname changes
  useEffect(() => {
    if (pathname !== previousPathname.current) {
      const startTime = Date.now();
      const event: NavEvent = {
        id: `nav-${++eventIdCounter.current}`,
        timestamp: startTime,
        type: 'state-change',
        from: previousPathname.current,
        to: pathname,
        stack: '',
        segments: segments
      };
      
      setEvents(prev => [...prev.slice(-19), event]);
      
      // Track route change in metrics
      const duration = Date.now() - startTime;
      metrics.trackRouteChange(previousPathname.current, pathname, duration);
      
      previousPathname.current = pathname;
    }
  }, [pathname, segments]);
  
  // Track navigation state changes
  useEffect(() => {
    if (navigationState && !navigationState.loading) {
      // Navigation state is ready
    }
  }, [navigationState]);
  
  if (!__DEV__) return null;
  
  return (
    <View style={[styles.container, { bottom: insets.bottom + 60 }]}>
      <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.header}>
        <Text style={styles.headerText}>
          🧭 Nav Debug ({events.length}) - {pathname}
        </Text>
      </Pressable>
      
      {isExpanded && (
        <ScrollView style={styles.eventList}>
          <Text style={styles.currentState}>
            Current: {pathname} | Segments: {segments.join('/')}
          </Text>
          
          {events.slice().reverse().map((event) => (
            <View key={event.id} style={styles.event}>
              <Text style={styles.eventType}>
                {event.type.toUpperCase()} @ {new Date(event.timestamp).toLocaleTimeString()}
              </Text>
              <Text style={styles.eventPath}>
                {event.from} → {event.to}
              </Text>
              {event.params && (
                <Text style={styles.eventParams}>
                  Params: {JSON.stringify(event.params, null, 2)}
                </Text>
              )}
              {event.stack && (
                <Text style={styles.eventStack} numberOfLines={3}>
                  {event.stack}
                </Text>
              )}
            </View>
          ))}
          
          <Pressable onPress={() => setEvents([])} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear Events</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    maxHeight: 400,
    zIndex: 9999,
  },
  header: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentState: {
    color: '#0f0',
    fontSize: 12,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  eventList: {
    maxHeight: 300,
    paddingRight: 12, // Add padding to prevent scrollbar overlap
  },
  event: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  eventType: {
    color: '#ff0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventPath: {
    color: '#fff',
    fontSize: 11,
    marginTop: 2,
  },
  eventParams: {
    color: '#0ff',
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  eventStack: {
    color: '#888',
    fontSize: 9,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  clearButton: {
    margin: 10,
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default NavigationDebugger;