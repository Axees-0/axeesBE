# Design System - Omnichannel Loyalty SaaS Platform

## 1. Global Navigation Structure

### Main Navigation Menu Items
- **Dashboard** (index.html) - Overview and key metrics
- **Loyalty Program** (loyalty.html) - Points, rewards, missions
- **Admin Panel** (admin.html) - Business rules and management  
- **Analytics** (analytics.html) - AI-powered insights and reporting
- **POS Integration** (pos.html) - Real-time POS system demo
- **User Profiles** (profiles.html) - Customer segmentation

### Navigation Behavior
- Fixed top navigation bar with horizontal menu
- Active page highlighted with primary color
- Hover states with secondary color
- Logo positioned top-left
- Navigation items center-aligned

## 2. Shared CSS Variables & Styling

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-light: #dbeafe;
  
  /* Secondary Colors */
  --secondary-color: #f59e0b;
  --secondary-hover: #d97706;
  --secondary-light: #fef3c7;
  
  /* Neutral Colors */
  --background-color: #f8fafc;
  --surface-color: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  
  /* Status Colors */
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --info-color: #06b6d4;
  
  /* Border & Shadow */
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Typography
```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;

/* Font Sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.25rem;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing Standards
```css
/* Spacing Scale */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
--space-16: 4rem;
--space-20: 5rem;
--space-24: 6rem;
```

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  padding: var(--space-3) var(--space-6);
  border: none;
  border-radius: 0.5rem;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
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
  background-color: var(--surface-color);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--primary-light);
}
```

### Card Component Styling
```css
.card {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-color);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.card-content {
  color: var(--text-secondary);
  line-height: 1.6;
}
```

### Form Input Styling
```css
.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: var(--text-sm);
  color: var(--text-primary);
  background-color: var(--surface-color);
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}
```

## 3. Component Templates

### Navigation Template
```html
<nav class="navbar">
  <div class="nav-container">
    <div class="nav-logo">
      <img src="data:image/svg+xml,..." alt="Loyalty Platform" class="logo">
      <span class="logo-text">LoyaltyMax</span>
    </div>
    <ul class="nav-menu">
      <li class="nav-item"><a href="index.html" class="nav-link">Dashboard</a></li>
      <li class="nav-item"><a href="loyalty.html" class="nav-link">Loyalty Program</a></li>
      <li class="nav-item"><a href="admin.html" class="nav-link">Admin Panel</a></li>
      <li class="nav-item"><a href="analytics.html" class="nav-link">Analytics</a></li>
      <li class="nav-item"><a href="pos.html" class="nav-link">POS Integration</a></li>
      <li class="nav-item"><a href="profiles.html" class="nav-link">User Profiles</a></li>
    </ul>
    <div class="nav-actions">
      <button class="btn-secondary">Settings</button>
      <button class="btn-primary">Get Started</button>
    </div>
  </div>
</nav>
```

### Footer Template
```html
<footer class="footer">
  <div class="footer-container">
    <div class="footer-section">
      <h3 class="footer-title">LoyaltyMax</h3>
      <p class="footer-text">Next-generation omnichannel loyalty platform</p>
    </div>
    <div class="footer-section">
      <h4 class="footer-subtitle">Platform</h4>
      <ul class="footer-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#integrations">Integrations</a></li>
        <li><a href="#analytics">Analytics</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h4 class="footer-subtitle">Support</h4>
      <ul class="footer-links">
        <li><a href="#docs">Documentation</a></li>
        <li><a href="#support">24/7 Support</a></li>
        <li><a href="#training">Training</a></li>
      </ul>
    </div>
  </div>
</footer>
```

### Card Component Template
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
  </div>
  <div class="card-content">
    <p>Card content goes here...</p>
  </div>
</div>
```

### Button Templates
```html
<!-- Primary Button -->
<button class="btn-primary">Primary Action</button>

<!-- Secondary Button -->
<button class="btn-secondary">Secondary Action</button>

<!-- Icon Button -->
<button class="btn-primary">
  <span class="btn-icon">📊</span>
  View Analytics
</button>
```

### Form Element Templates
```html
<div class="form-group">
  <label class="form-label" for="input-id">Field Label</label>
  <input type="text" id="input-id" class="form-input" placeholder="Enter value...">
</div>

<div class="form-group">
  <label class="form-label" for="select-id">Select Option</label>
  <select id="select-id" class="form-input">
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
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
  <title>Page Title - LoyaltyMax</title>
</head>
<body>
  <nav class="navbar">...</nav>
  <main class="main-content">
    <div class="container">
      <!-- Page content -->
    </div>
  </main>
  <footer class="footer">...</footer>
</body>
</html>
```

### Container Specifications
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.main-content {
  min-height: calc(100vh - 140px); /* Account for nav + footer */
  padding: var(--space-8) 0;
}
```

### Responsive Breakpoints (Desktop-Only)
```css
/* Large Desktop */
@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}

/* Standard Desktop */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

/* Small Desktop/Large Tablet */
@media (min-width: 768px) {
  .container { max-width: 768px; }
}
```

### Header, Main, Footer Layout
```css
body {
  margin: 0;
  font-family: var(--font-primary);
  background-color: var(--background-color);
  color: var(--text-primary);
  line-height: 1.6;
}

.navbar {
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 100;
  height: 70px;
}

.main-content {
  margin-top: 70px; /* Account for fixed navbar */
}

.footer {
  background-color: var(--text-primary);
  color: var(--surface-color);
  padding: var(--space-12) 0 var(--space-8);
}
```

## Implementation Notes

- Use CSS custom properties for consistent theming
- Implement smooth transitions for interactive elements
- Ensure proper contrast ratios for accessibility
- Use semantic HTML structure throughout
- Follow mobile-first approach even for desktop-only design
- Implement hover states for all interactive elements
- Use consistent spacing and typography scales