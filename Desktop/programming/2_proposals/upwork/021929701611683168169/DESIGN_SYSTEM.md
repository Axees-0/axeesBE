# Design System - ConvertIQ AI

## 1. Global Navigation Structure

### Main Navigation Menu Items
- **Home** - Landing page with URL input and analysis tool
- **Dashboard** - Analysis results and insights display
- **Credits** - Referral system and credit management
- **Reports** - Historical analysis reports (if applicable)

### Navigation Behavior
- Fixed top navigation bar on all pages
- Horizontal menu layout for desktop
- Active state highlighting for current page
- Smooth hover transitions

## 2. Color Palette & CSS Variables

```css
:root {
  /* Primary Brand Colors */
  --primary-color: #2563eb;        /* Blue - Main brand color */
  --primary-dark: #1d4ed8;         /* Darker blue for hover states */
  --primary-light: #dbeafe;        /* Light blue for backgrounds */
  
  /* Secondary Colors */
  --secondary-color: #059669;      /* Green - Success/positive */
  --secondary-dark: #047857;       /* Dark green */
  --secondary-light: #d1fae5;      /* Light green */
  
  /* Alert Colors */
  --warning-color: #dc2626;        /* Red - Urgent fixes */
  --warning-light: #fee2e2;        /* Light red background */
  --info-color: #0891b2;           /* Cyan - Information */
  --info-light: #cffafe;           /* Light cyan background */
  
  /* Neutral Colors */
  --text-primary: #111827;         /* Dark gray - Primary text */
  --text-secondary: #6b7280;       /* Medium gray - Secondary text */
  --text-muted: #9ca3af;           /* Light gray - Muted text */
  --background: #ffffff;           /* White background */
  --background-secondary: #f9fafb; /* Light gray background */
  --border-color: #e5e7eb;         /* Border gray */
  --border-light: #f3f4f6;        /* Light border */
  
  /* Spacing System */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
  --space-3xl: 4rem;     /* 64px */
  
  /* Border Radius */
  --radius-sm: 0.375rem;  /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

## 3. Typography System

```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

## 4. Button Styles

### Primary Button
```css
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  font-size: var(--text-base);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

### Secondary Button
```css
.btn-secondary {
  background-color: transparent;
  color: var(--primary-color);
  padding: var(--space-sm) var(--space-lg);
  border: 2px solid var(--primary-color);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  font-size: var(--text-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-1px);
}
```

### Button Sizes
```css
.btn-sm { padding: var(--space-xs) var(--space-md); font-size: var(--text-sm); }
.btn-lg { padding: var(--space-md) var(--space-2xl); font-size: var(--text-lg); }
```

## 5. Card Components

### Base Card
```css
.card {
  background: var(--background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Analysis Result Card
```css
.analysis-card {
  background: var(--background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-lg);
  box-shadow: var(--shadow-md);
}

.analysis-card.urgent {
  border-left: 4px solid var(--warning-color);
  background: var(--warning-light);
}

.analysis-card.improvement {
  border-left: 4px solid var(--secondary-color);
  background: var(--secondary-light);
}
```

## 6. Form Elements

### Input Fields
```css
.form-input {
  width: 100%;
  padding: var(--space-md);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: border-color 0.2s ease;
  background: var(--background);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-label {
  display: block;
  margin-bottom: var(--space-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}
```

## 7. Layout Standards

### Page Container
```css
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
  min-height: 100vh;
}

.content-wrapper {
  padding-top: var(--space-3xl);
  padding-bottom: var(--space-3xl);
}
```

### Navigation Header
```css
.site-header {
  background: var(--background);
  border-bottom: 1px solid var(--border-color);
  padding: var(--space-md) 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

## 8. Component Templates

### Navigation Template
```html
<header class="site-header">
  <div class="nav-container">
    <div class="logo">
      <h1>ConvertIQ AI</h1>
    </div>
    <nav class="main-nav">
      <a href="index.html" class="nav-link active">Home</a>
      <a href="dashboard.html" class="nav-link">Dashboard</a>
      <a href="credits.html" class="nav-link">Credits</a>
    </nav>
  </div>
</header>
```

### Analysis Card Template
```html
<div class="analysis-card urgent">
  <div class="card-header">
    <h3 class="card-title">Urgent Fix Required</h3>
    <span class="priority-badge high">High Priority</span>
  </div>
  <div class="card-content">
    <p class="issue-description">Missing strong call-to-action above the fold</p>
    <div class="recommendation">
      <h4>Recommendation:</h4>
      <p>Add a prominent CTA button within the hero section...</p>
    </div>
  </div>
  <div class="card-footer">
    <button class="btn-primary btn-sm">View Details</button>
    <button class="btn-secondary btn-sm">Mark as Fixed</button>
  </div>
</div>
```

## 9. Utility Classes

### Spacing Utilities
```css
.m-0 { margin: 0; }
.mt-sm { margin-top: var(--space-sm); }
.mb-md { margin-bottom: var(--space-md); }
.p-lg { padding: var(--space-lg); }

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-md { gap: var(--space-md); }
```

### Text Utilities
```css
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-muted); }
.text-success { color: var(--secondary-color); }
.text-warning { color: var(--warning-color); }

.font-medium { font-weight: var(--font-medium); }
.font-semibold { font-weight: var(--font-semibold); }
.font-bold { font-weight: var(--font-bold); }
```

## 10. Animation & Transitions

### Loading States
```css
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Hover Effects
```css
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

## 11. Responsive Breakpoints (Desktop Focus)

```css
/* Desktop-first approach */
.desktop-only { display: block; }

/* Large Desktop */
@media (min-width: 1440px) {
  .page-container { max-width: 1400px; }
}

/* Standard Desktop */
@media (max-width: 1200px) {
  .page-container { max-width: 100%; }
}
```

## 12. Brand Guidelines

### Logo Usage
- Logo positioned top-left in navigation
- Use "ConvertIQ AI" as text logo with primary color
- Minimum size: 150px width
- Clear space: equal to the height of the logo on all sides

### Voice & Tone
- Professional yet approachable
- Data-driven and confident
- Clear and action-oriented
- Avoid jargon, focus on benefits

This design system ensures consistent styling across all pages and components while maintaining the professional appearance required for the Upwork proposal demo.