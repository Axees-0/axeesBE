import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Platform } from 'react-native';

// Debug logging system
const debugLogs: string[] = [];
const addDebugLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  debugLogs.push(logEntry);
  console.log(logEntry);
  
  // Trigger re-render of debug panel if it exists
  if (typeof window !== 'undefined' && (window as any).updateDebugPanel) {
    (window as any).updateDebugPanel();
  }
};

// Debug Panel Component
export const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  React.useEffect(() => {
    // Create portal container
    if (typeof window !== 'undefined') {
      const container = document.createElement('div');
      container.id = 'debug-panel-portal';
      document.body.appendChild(container);
      setPortalContainer(container);
      
      // Set up the global update function
      (window as any).updateDebugPanel = () => {
        setLogs([...debugLogs]);
      };
      
      // Initialize with existing logs
      setLogs([...debugLogs]);
      
      return () => {
        delete (window as any).updateDebugPanel;
        document.body.removeChild(container);
      };
    }
  }, []);

  // Don't render until portal container is ready
  if (!portalContainer || typeof window === 'undefined') {
    return null;
  }

  const content = !isVisible ? (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 9999,
      backgroundColor: '#000',
      color: '#fff',
      padding: '10px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontFamily: 'monospace',
      fontSize: '12px'
    }} onClick={() => setIsVisible(true)}>
      🐛 Debug Panel (Click to Show)
    </div>
  ) : (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      width: '400px',
      maxHeight: '300px',
      backgroundColor: '#000',
      color: '#fff',
      border: '2px solid #333',
      borderRadius: '8px',
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: '11px',
      overflow: 'hidden'
    }}>
      <div style={{
        backgroundColor: '#333',
        padding: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>🐛 Context Debug Panel</span>
        <div>
          <button 
            onClick={() => { debugLogs.length = 0; setLogs([]); }}
            style={{
              background: '#666',
              color: '#fff',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              marginRight: '8px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Clear
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            style={{
              background: '#666',
              color: '#fff',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Hide
          </button>
        </div>
      </div>
      <div style={{
        padding: '12px',
        maxHeight: '250px',
        overflowY: 'auto',
        lineHeight: '1.4'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#888' }}>No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ 
              marginBottom: '4px',
              color: log.includes('❌') ? '#ff6b6b' : 
                    log.includes('✅') ? '#51cf66' :
                    log.includes('🟡') ? '#ffd43b' :
                    log.includes('🔴') ? '#ff8cc8' :
                    log.includes('🚫') ? '#ff922b' : '#fff'
            }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Render using portal to ensure it appears above everything
  return createPortal(content, portalContainer);
};

// Global flag to prevent spam logging during navigation transitions
declare global {
  var __discoveryFilterErrorLogged: boolean | undefined;
}

interface FilterState {
  // General filters
  priceRange: { min: number; max: number };
  selectedTier: string[];
  followerSize: string;
  selectedPlatforms: string[];
  postingFrequency: string;
  
  // Location filters
  locationType: 'local' | 'country' | 'event';
  selectedCountries: string[];
  selectedCities: string[];
  
  // Demographic filters
  genderRatio: { male: number; female: number };
  ageRange: { min: number; max: number };
  selectedLanguages: string[];
  influencerAge: { min: number; max: number };
  selectedGroups: string[];
  
  // Category filters
  selectedCategories: string[];
  
  // Search
  searchText: string;
  
  // UI state
  activeFilterSection: 'filters' | 'location' | 'demographic' | 'category' | null;
}

interface DiscoveryFilterContextType {
  filters: FilterState;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
  getActiveFilterCount: () => number;
}

const defaultFilters: FilterState = {
  priceRange: { min: 0, max: 10000 },
  selectedTier: [],
  followerSize: 'all',
  selectedPlatforms: [],
  postingFrequency: 'all',
  locationType: 'country',
  selectedCountries: [],
  selectedCities: [],
  genderRatio: { male: 50, female: 50 },
  ageRange: { min: 18, max: 65 },
  selectedLanguages: ['English'],
  influencerAge: { min: 18, max: 50 },
  selectedGroups: [],
  selectedCategories: [],
  searchText: '',
  activeFilterSection: null,
};

const DiscoveryFilterContext = createContext<DiscoveryFilterContextType | undefined>(undefined);

export const DiscoveryFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  addDebugLog('🔴 DiscoveryFilterProvider function called - about to render');
  addDebugLog(`🔴 Platform: ${Platform.OS}, isWeb: ${Platform.OS === 'web'}`);
  addDebugLog(`🔴 window exists: ${typeof window !== 'undefined'}`);
  
  try {
    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    addDebugLog('🔴 useState initialized successfully');
    addDebugLog(`🔴 Current filters state: ${JSON.stringify(filters, null, 2)}`);

    // Debug logging
    addDebugLog('🔴 DiscoveryFilterProvider rendering, providing context');

    const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      addDebugLog(`✅ Real updateFilter called: ${String(key)} = ${JSON.stringify(value)}`);
      setFilters(prev => ({
        ...prev,
        [key]: value
      }));
    };

    const resetFilters = () => {
      setFilters(defaultFilters);
    };

    const hasActiveFilters = () => {
      return (
        filters.priceRange.min !== defaultFilters.priceRange.min ||
        filters.priceRange.max !== defaultFilters.priceRange.max ||
        filters.selectedTier.length > 0 ||
        filters.followerSize !== 'all' ||
        filters.selectedPlatforms.length > 0 ||
        filters.postingFrequency !== 'all' ||
        filters.selectedCountries.length > 0 ||
        filters.selectedCities.length > 0 ||
        filters.selectedLanguages.length !== 1 || 
        filters.selectedLanguages[0] !== 'English' ||
        filters.selectedGroups.length > 0 ||
        filters.selectedCategories.length > 0 ||
        filters.searchText.trim() !== ''
      );
    };

    const getActiveFilterCount = () => {
      let count = 0;
      
      if (filters.priceRange.min !== defaultFilters.priceRange.min || 
          filters.priceRange.max !== defaultFilters.priceRange.max) count++;
      if (filters.selectedTier.length > 0) count++;
      if (filters.followerSize !== 'all') count++;
      if (filters.selectedPlatforms.length > 0) count++;
      if (filters.postingFrequency !== 'all') count++;
      if (filters.selectedCountries.length > 0) count++;
      if (filters.selectedCities.length > 0) count++;
      if (filters.selectedLanguages.length !== 1 || filters.selectedLanguages[0] !== 'English') count++;
      if (filters.selectedGroups.length > 0) count++;
      if (filters.selectedCategories.length > 0) count++;
      if (filters.searchText.trim() !== '') count++;
      
      return count;
    };

    const contextValue = { 
      filters, 
      updateFilter, 
      resetFilters, 
      hasActiveFilters,
      getActiveFilterCount 
    };
    
    addDebugLog('🔴 About to return provider JSX');
    addDebugLog(`🔴 Context value being provided: ${JSON.stringify(Object.keys(contextValue))}`);
    
    return (
      <DiscoveryFilterContext.Provider value={contextValue}>
        {children}
      </DiscoveryFilterContext.Provider>
    );
  } catch (error) {
    addDebugLog(`🚨 ERROR in DiscoveryFilterProvider: ${error}`);
    // Return minimal provider that works
    return <DiscoveryFilterContext.Provider value={undefined}>{children}</DiscoveryFilterContext.Provider>;
  }
};

export const useDiscoveryFilters = () => {
  const context = useContext(DiscoveryFilterContext);
  addDebugLog(`🟡 useDiscoveryFilters called, context available: ${!!context}`);
  addDebugLog(`🟡 Context type: ${typeof context}`);
  addDebugLog(`🟡 Context value: ${context ? JSON.stringify(Object.keys(context)) : 'null/undefined'}`);
  
  if (!context) {
    addDebugLog('❌ CONTEXT UNAVAILABLE - returning fallback with no-op functions');
    
    // Return a functional fallback that clearly logs what's happening
    return {
      filters: defaultFilters,
      updateFilter: (key: any, value: any) => {
        addDebugLog(`🚫 FALLBACK updateFilter called: ${key} = ${JSON.stringify(value)} (This does nothing!)`);
      },
      resetFilters: () => {
        addDebugLog('🚫 FALLBACK resetFilters called (This does nothing!)');
      },
      hasActiveFilters: () => false,
      getActiveFilterCount: () => 0,
    };
  }
  
  addDebugLog('✅ Context available, returning real functions');
  return context;
};