// Quick Style Fixes based on transcript feedback
// "this color in here is just like really... make the button maybe a little one"

export const QuickFixes = {
  // Reduce button sizes
  buttonSizes: {
    large: 40,  // was 48
    medium: 32, // was 41  
    small: 24,  // was 32
  },
  
  // More subtle colors
  colors: {
    primary: '#430B92',      // keep brand
    primaryLight: '#6B3AA0', // lighter variant
    primarySubtle: '#F0E7FD', // very light for backgrounds
    
    // Status colors for payment visibility
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    pending: '#2196F3',
  },
  
  // Consistent spacing (8px grid)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  // Card styles - less prominent
  card: {
    padding: 12, // was 20
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowOpacity: 0.05, // was 0.1
    shadowRadius: 4,     // was 8
    elevation: 2,        // was 3
  },
  
  // Typography - cleaner hierarchy
  typography: {
    h1: { fontSize: 24, fontWeight: '600' },
    h2: { fontSize: 20, fontWeight: '600' },
    h3: { fontSize: 16, fontWeight: '500' },
    body: { fontSize: 14, fontWeight: '400' },
    caption: { fontSize: 12, fontWeight: '400' },
  }
};

// Payment status badge styles
export const PaymentBadgeStyles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paid: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  pending: {
    backgroundColor: '#E3F2FD', 
    borderColor: '#2196F3',
  },
  escrow: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  }
};