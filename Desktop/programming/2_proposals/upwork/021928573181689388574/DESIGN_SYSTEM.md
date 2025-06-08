# Design System - AI Conversion Optimizer Pro

## Project Overview
AI-powered conversion optimization platform that analyzes user behavior, identifies bottlenecks, and provides actionable recommendations to maximize website conversion rates through advanced machine learning algorithms.

## 1. Global Navigation Structure

### Main Navigation Menu Items
- **Dashboard** (index.html) - Main analytics overview
- **Analytics** (analytics.html) - Detailed performance metrics 
- **Optimizer** (optimizer.html) - AI recommendation engine
- **A/B Testing** (testing.html) - Experiment management
- **Reports** (reports.html) - Comprehensive insights

### Navigation Behavior
- Horizontal top navigation bar
- Active page highlighted with primary color
- Smooth hover transitions
- Logo positioned top-left with home link

## 2. Global CSS Variables & Styling

### Color Palette
```css
:root {
  --primary-color: #6366f1;
  --primary-hover: #5855eb;
  --secondary-color: #10b981;
  --accent-color: #f59e0b;
  --danger-color: #ef4444;
  --background-color: #f8fafc;
  --surface-color: #ffffff;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border-color: #e5e7eb;
  --border-light: #f3f4f6;
}
```

### Typography
```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;
--font-size-2xl: 1.5rem;
--font-size-3xl: 1.875rem;
--font-size-4xl: 2.25rem;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Spacing Standards
```css
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
--spacing-2xl: 3rem;
--spacing-3xl: 4rem;
```

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Success Button */
.btn-success {
  background: var(--secondary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}
```

### Card Components
```css
.card {
  background: var(--surface-color);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-light);
}

.card-header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}
```

### Form Elements
```css
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: var(--font-size-base);
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-label {
  display: block;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}
```

## 3. Component Templates

### Navigation Template
```html
<nav class="main-nav">
  <div class="nav-container">
    <div class="nav-brand">
      <a href="index.html">
        <h2>AI Optimizer Pro</h2>
      </a>
    </div>
    <ul class="nav-menu">
      <li><a href="index.html" class="nav-link">Dashboard</a></li>
      <li><a href="analytics.html" class="nav-link">Analytics</a></li>
      <li><a href="optimizer.html" class="nav-link">Optimizer</a></li>
      <li><a href="testing.html" class="nav-link">A/B Testing</a></li>
      <li><a href="reports.html" class="nav-link">Reports</a></li>
    </ul>
  </div>
</nav>
```

### Card Component Template
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
  </div>
  <div class="card-content">
    <!-- Card content here -->
  </div>
</div>
```

### Metric Card Template
```html
<div class="metric-card">
  <div class="metric-value">$2,847</div>
  <div class="metric-label">Revenue</div>
  <div class="metric-change positive">+12.5%</div>
</div>
```

### Button Templates
```html
<!-- Primary Action -->
<button class="btn-primary">Start Optimization</button>

<!-- Secondary Action -->
<button class="btn-secondary">View Details</button>

<!-- Success Action -->
<button class="btn-success">Apply Changes</button>
```

## 4. Page Layout Standards

### Page Container
```css
.page-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: var(--spacing-xl) 0;
}
```

### Grid System
```css
.grid {
  display: grid;
  gap: var(--spacing-lg);
}

.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

.grid-auto { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
```

### Header Layout
```css
.page-header {
  margin-bottom: var(--spacing-2xl);
}

.page-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.page-subtitle {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin: 0;
}
```

## 5. Interactive States

### Loading States
```css
.loading {
  opacity: 0.6;
  pointer-events: none;
}

.spinner {
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Hover Effects
```css
.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.nav-link:hover {
  color: var(--primary-color);
}
```

## 6. Responsive Breakpoints (Desktop-Only)

### Large Screens (1200px+)
- Full grid layouts
- Maximum content width: 1440px
- Sidebar navigation available

### Medium Screens (768px - 1199px)
- Simplified grid layouts
- Reduced padding and margins
- Collapsed navigation menu

### Minimum Width: 768px
- No support below tablet landscape
- Focus on desktop experience

## 7. Accessibility Standards

### Color Contrast
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text
- Focus indicators visible on all interactive elements

### Navigation
- Keyboard navigation support
- Clear focus states
- Semantic HTML structure

## 8. Performance Guidelines

### CSS Organization
- Use CSS custom properties for theming
- Minimize DOM reflows with transform animations
- Optimize for rendering performance

### JavaScript Loading
- Defer non-critical JavaScript
- Use localStorage for persistent data
- Minimize DOM queries with caching

This design system ensures consistent, professional appearance across all pages while maintaining the desktop-only focus and vanilla HTML/CSS/JavaScript requirements.