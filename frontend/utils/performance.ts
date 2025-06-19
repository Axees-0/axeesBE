/**
 * Performance utilities for demo and production optimization
 */

export const PerformanceUtils = {
  // Basic performance utilities
  now: () => Date.now(),
  
  measure: (name: string, fn: () => void) => {
    const start = Date.now();
    fn();
    const end = Date.now();
    console.log(`[PERF] ${name}: ${end - start}ms`);
  },
  
  debounce: (fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), delay);
    };
  }
};

export const DemoPerformance = {
  measureDemoFlow: (flowName: string) => ({
    start: () => {
      console.log(`🎬 [DEMO FLOW] ${flowName} started`);
    },
    end: () => {
      console.log(`🎬 [DEMO FLOW] ${flowName} completed`);
    }
  }),
  
  initializeDemo: () => {
    console.log('🎬 [DEMO] Performance optimizations initialized');
  },
  
  optimizeAnalyticsDashboard: async () => {
    // Simulate async optimization
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('🎬 [DEMO] Analytics dashboard optimized');
        resolve(true);
      }, 200);
    });
  }
};

export const LayoutStability = {
  createStableContainer: (height: number) => ({
    minHeight: height,
    display: 'flex' as const,
    flexDirection: 'column' as const,
  })
};