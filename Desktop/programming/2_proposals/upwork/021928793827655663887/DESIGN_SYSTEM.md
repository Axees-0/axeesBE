# AI-Powered Sales & Marketing Platform - Design System

## Global Navigation Structure

### Navigation Menu Items
- **Home** (`index.html`) - Platform overview and value proposition
- **Dashboard** (`dashboard.html`) - Real-time metrics and lead lifecycle monitoring
- **AI Lead Scoring** (`lead-scoring.html`) - AI-powered lead enrichment and scoring
- **Automation Workflows** (`workflows.html`) - HubSpot/GHL integration demonstrations
- **Campaign Management** (`campaigns.html`) - Multi-channel nurturing campaigns
- **Analytics** (`analytics.html`) - ROI metrics and performance insights

### Navigation Behavior
- Top horizontal navigation bar with logo on left
- Navigation links center-aligned with hover effects
- Active page highlighted with primary color
- Desktop-only design with fixed header

## Shared CSS Variables & Styling

### Color Palette
```css
:root {
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --secondary-color: #10b981;
  --secondary-hover: #059669;
  --accent-color: #f59e0b;
  --background-color: #f8fafc;
  --surface-color: #ffffff;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border-color: #e5e7eb;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Typography
```css
--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Secondary Button */
.btn-secondary {
  background-color: transparent;
  color: var(--primary-color);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: 2px solid var(--primary-color);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-1px);
}

/* Success Button */
.btn-success {
  background-color: var(--secondary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-success:hover {
  background-color: var(--secondary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

### Card Components
```css
.card {
  background-color: var(--surface-color);
  border-radius: 0.75rem;
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.card-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}
```

### Form Elements
```css
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background-color: var(--surface-color);
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background-color: var(--surface-color);
  cursor: pointer;
}
```

## Component Templates

### Navigation Template
```html
<nav class="navbar">
  <div class="nav-container">
    <div class="nav-logo">
      <h2>AI Sales Pro</h2>
    </div>
    <ul class="nav-menu">
      <li><a href="index.html" class="nav-link">Home</a></li>
      <li><a href="dashboard.html" class="nav-link">Dashboard</a></li>
      <li><a href="lead-scoring.html" class="nav-link">AI Lead Scoring</a></li>
      <li><a href="workflows.html" class="nav-link">Automation</a></li>
      <li><a href="campaigns.html" class="nav-link">Campaigns</a></li>
      <li><a href="analytics.html" class="nav-link">Analytics</a></li>
    </ul>
  </div>
</nav>
```

### Footer Template
```html
<footer class="footer">
  <div class="footer-container">
    <div class="footer-content">
      <div class="footer-section">
        <h4>AI Sales Pro</h4>
        <p>Enterprise-grade AI-powered sales & marketing automation platform</p>
      </div>
      <div class="footer-section">
        <h5>Platform</h5>
        <ul>
          <li><a href="dashboard.html">Dashboard</a></li>
          <li><a href="lead-scoring.html">AI Lead Scoring</a></li>
          <li><a href="workflows.html">Automation</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h5>Features</h5>
        <ul>
          <li><a href="campaigns.html">Campaigns</a></li>
          <li><a href="analytics.html">Analytics</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2025 AI Sales Pro. All rights reserved.</p>
    </div>
  </div>
</footer>
```

### Card Component Template
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-subtitle">Card subtitle or description</p>
  </div>
  <div class="card-content">
    <!-- Card content goes here -->
  </div>
</div>
```

### Button Templates
```html
<!-- Primary Button -->
<button class="btn-primary">Primary Action</button>

<!-- Secondary Button -->
<button class="btn-secondary">Secondary Action</button>

<!-- Success Button -->
<button class="btn-success">Success Action</button>
```

### Form Template
```html
<form class="form">
  <div class="form-group">
    <label class="form-label" for="input-id">Label Text</label>
    <input type="text" id="input-id" class="form-input" placeholder="Placeholder text">
  </div>
  <div class="form-group">
    <label class="form-label" for="select-id">Select Label</label>
    <select id="select-id" class="form-select">
      <option value="">Choose option</option>
      <option value="option1">Option 1</option>
    </select>
  </div>
  <button type="submit" class="btn-primary">Submit</button>
</form>
```

## Page Layout Standards

### Page Container
```css
.page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: var(--spacing-xl) var(--spacing-md);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
```

### Header Layout
```css
.navbar {
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;
}
```

### Footer Layout
```css
.footer {
  background-color: var(--text-primary);
  color: white;
  margin-top: var(--spacing-3xl);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-md) var(--spacing-md);
}
```

## Responsive Breakpoints (Desktop-Only)

### Desktop Standards
- **Large Desktop**: 1200px+ (max-width container)
- **Standard Desktop**: 1024px - 1199px (responsive container)
- **Small Desktop**: 768px - 1023px (minimum supported width)

### Grid System
```css
.grid {
  display: grid;
  gap: var(--spacing-lg);
}

.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

/* Auto-fit responsive columns */
.grid-auto {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

## Chart and Visualization Standards

### Chart Container
```css
.chart-container {
  background-color: var(--surface-color);
  border-radius: 0.75rem;
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  margin-bottom: var(--spacing-lg);
}

.chart-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.chart-canvas {
  width: 100%;
  height: 300px;
}
```

## Status Indicators

### Status Badges
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-success {
  background-color: rgb(220 252 231);
  color: rgb(22 101 52);
}

.status-warning {
  background-color: rgb(254 243 199);
  color: rgb(146 64 14);
}

.status-error {
  background-color: rgb(254 226 226);
  color: rgb(153 27 27);
}

.status-info {
  background-color: rgb(219 234 254);
  color: rgb(30 64 175);
}
```

## Loading States

### Spinner
```css
.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Skeleton Loading
```css
.skeleton {
  background: linear-gradient(90deg, var(--border-color) 25%, transparent 37%, var(--border-color) 63%);
  background-size: 400% 100%;
  animation: skeleton 1.4s ease-in-out infinite;
}

@keyframes skeleton {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
```