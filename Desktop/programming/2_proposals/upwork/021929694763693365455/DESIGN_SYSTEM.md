# AI-Driven MVP Demo - Design System

## 1. Global Navigation Structure

### Primary Navigation Menu
```html
<nav class="main-nav">
  <div class="nav-brand">
    <h1>AI Analytics Pro</h1>
  </div>
  <ul class="nav-links">
    <li><a href="index.html" class="nav-link">Dashboard</a></li>
    <li><a href="ai-analytics.html" class="nav-link">Analytics</a></li>
    <li><a href="model-management.html" class="nav-link">Models</a></li>
    <li><a href="data-insights.html" class="nav-link">Insights</a></li>
  </ul>
</nav>
```

### Navigation Behavior
- **Active State**: Current page highlighted with primary color
- **Hover Effects**: Smooth color transitions on navigation links
- **Responsive**: Fixed header with consistent navigation across all pages
- **Logo**: Top-left positioning with brand name

## 2. Global CSS Variables & Styling

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-light: #dbeafe;
  
  /* Secondary Colors */
  --secondary-color: #10b981;
  --secondary-hover: #059669;
  --secondary-light: #d1fae5;
  
  /* Neutral Colors */
  --background-color: #f8fafc;
  --surface-color: #ffffff;
  --border-color: #e2e8f0;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  
  /* Status Colors */
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --info-color: #3b82f6;
  
  /* AI Theme Colors */
  --ai-accent: #8b5cf6;
  --ai-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --chart-primary: #2563eb;
  --chart-secondary: #10b981;
  --chart-tertiary: #8b5cf6;
}
```

### Typography
```css
/* Font Families */
--font-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
--font-mono: 'Consolas', 'Monaco', 'Courier New', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing System
```css
/* Spacing Scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */

/* Border Radius */
--radius-sm: 0.25rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## 3. Component Templates

### Button Components
```html
<!-- Primary Button -->
<button class="btn btn-primary">
  Primary Action
</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">
  Secondary Action
</button>

<!-- Outline Button -->
<button class="btn btn-outline">
  Outline Action
</button>

<!-- Icon Button -->
<button class="btn btn-icon">
  <span class="icon">⚡</span>
  With Icon
</button>
```

### Button Styles
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
}

.btn-outline {
  background-color: transparent;
  color: var(--primary-color);
  border-color: var(--primary-color);
}
```

### Card Components
```html
<!-- Standard Card -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-subtitle">Card subtitle</p>
  </div>
  <div class="card-content">
    <p>Card content goes here</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>

<!-- Metric Card -->
<div class="card metric-card">
  <div class="metric-header">
    <span class="metric-label">Total Users</span>
    <span class="metric-trend trend-up">↗ +12%</span>
  </div>
  <div class="metric-value">24,589</div>
  <div class="metric-chart">
    <!-- Chart placeholder -->
  </div>
</div>

<!-- AI Status Card -->
<div class="card ai-card">
  <div class="ai-status">
    <div class="status-indicator active"></div>
    <span class="status-text">Model Active</span>
  </div>
  <h4 class="ai-model-name">GPT-4 Analytics</h4>
  <div class="ai-metrics">
    <div class="ai-metric">
      <span class="metric-label">Accuracy</span>
      <span class="metric-value">94.2%</span>
    </div>
  </div>
</div>
```

### Form Components
```html
<!-- Input Group -->
<div class="form-group">
  <label class="form-label" for="input-id">Label</label>
  <input class="form-input" type="text" id="input-id" placeholder="Placeholder">
</div>

<!-- Select Group -->
<div class="form-group">
  <label class="form-label" for="select-id">Select Option</label>
  <select class="form-select" id="select-id">
    <option value="">Choose option</option>
    <option value="1">Option 1</option>
  </select>
</div>

<!-- Checkbox Group -->
<div class="form-group">
  <label class="form-checkbox">
    <input type="checkbox" class="checkbox-input">
    <span class="checkbox-text">Checkbox label</span>
  </label>
</div>
```

## 4. Page Layout Standards

### Page Wrapper Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title - AI Analytics Pro</title>
  <style>
    /* Global styles included inline */
  </style>
</head>
<body>
  <header class="main-header">
    <!-- Navigation -->
  </header>
  
  <main class="main-content">
    <div class="container">
      <!-- Page content -->
    </div>
  </main>
  
  <footer class="main-footer">
    <!-- Footer content -->
  </footer>
  
  <script>
    /* Page-specific JavaScript */
  </script>
</body>
</html>
```

### Layout Grid System
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.dashboard-grid {
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-areas: 
    "sidebar main widgets"
    "sidebar main widgets";
}
```

### Desktop-Only Specifications
- **Minimum Width**: 1024px
- **Optimal Width**: 1200px-1440px
- **Navigation**: Fixed header, always visible
- **Sidebar**: Left sidebar for navigation (if applicable)
- **Content Area**: Central focus with adequate white space
- **No Mobile Considerations**: Desktop-only design focus

## 5. AI-Specific Design Elements

### AI Status Indicators
```css
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.active {
  background-color: var(--success-color);
  animation: pulse 2s infinite;
}

.status-indicator.warning {
  background-color: var(--warning-color);
}

.status-indicator.error {
  background-color: var(--error-color);
}
```

### Chart Container Standards
```css
.chart-container {
  width: 100%;
  height: 300px;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  position: relative;
}

.chart-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}
```

### Real-time Animation Classes
```css
.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}

.slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

## 6. Implementation Guidelines

### File Organization
- All styles inline using `<style>` tags
- JavaScript inline using `<script>` tags
- Relative linking between HTML pages
- Single directory structure
- Chart.js CDN for data visualization

### Consistency Requirements
- Use design system variables throughout
- Consistent spacing using spacing scale
- Uniform typography across all pages
- Standardized component styling
- Professional color scheme adherence

### Accessibility Standards
- Semantic HTML structure
- Proper heading hierarchy
- Alt text for images
- Keyboard navigation support
- Color contrast compliance

This design system ensures consistent, professional appearance across all demo pages while showcasing modern web development capabilities.