# Design System - AI Investment Due Diligence Platform

## Project Overview
Professional demonstration of capabilities for rebuilding Streamlit AI investment platform into modern API + front-end architecture. Showcases technical expertise in full-stack development, AI integration, and financial services UI/UX.

## 1. Global Navigation Structure

### Primary Navigation Menu
```
- Home (index.html)
- Live Dashboard (dashboard.html) 
- API Documentation (api-demo.html)
- Our Portfolio (portfolio.html)
- Contact (contact.html)
```

### Navigation Behavior
- Fixed top navigation bar
- Active page highlighted with primary color
- Smooth hover transitions
- Logo positioned top-left
- Navigation menu center-aligned

## 2. Brand Identity & Color Palette

### Colors (CSS Custom Properties)
```css
:root {
  /* Primary Colors */
  --primary-color: #2563eb;      /* Professional Blue */
  --primary-dark: #1d4ed8;       /* Darker Blue for hover */
  --primary-light: #dbeafe;      /* Light Blue for backgrounds */
  
  /* Secondary Colors */
  --secondary-color: #059669;    /* Success Green */
  --secondary-dark: #047857;     /* Dark Green */
  --secondary-light: #d1fae5;    /* Light Green */
  
  /* Neutral Colors */
  --gray-900: #111827;           /* Dark Text */
  --gray-800: #1f2937;           /* Section Headers */
  --gray-700: #374151;           /* Body Text */
  --gray-600: #4b5563;           /* Muted Text */
  --gray-500: #6b7280;           /* Borders */
  --gray-400: #9ca3af;           /* Light Borders */
  --gray-300: #d1d5db;           /* Backgrounds */
  --gray-200: #e5e7eb;           /* Light Backgrounds */
  --gray-100: #f3f4f6;           /* Subtle Backgrounds */
  --gray-50: #f9fafb;            /* Page Backgrounds */
  
  /* Accent Colors */
  --accent-orange: #f59e0b;      /* Warnings/Highlights */
  --accent-red: #dc2626;         /* Errors/Critical */
  --accent-purple: #7c3aed;      /* Premium Features */
  
  /* Background */
  --bg-primary: #ffffff;         /* Main Background */
  --bg-secondary: var(--gray-50); /* Section Backgrounds */
}
```

### Typography
```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'Fira Code', 'Monaco', 'Cascadia Code', monospace;

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
--leading-relaxed: 1.625;
```

## 3. Spacing & Layout Standards

### Spacing Scale
```css
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
--space-24: 6rem;     /* 96px */
```

### Container & Layout
```css
--container-max-width: 1200px;
--container-padding: var(--space-6);
--header-height: 4rem;
--section-spacing: var(--space-16);
```

## 4. Component Templates

### Navigation Header Template
```html
<header class="main-header">
  <div class="container">
    <div class="nav-brand">
      <img src="assets/logo.svg" alt="Romina Day AI" class="logo">
    </div>
    <nav class="main-nav">
      <a href="index.html" class="nav-link active">Home</a>
      <a href="dashboard.html" class="nav-link">Live Dashboard</a>
      <a href="api-demo.html" class="nav-link">API Docs</a>
      <a href="portfolio.html" class="nav-link">Portfolio</a>
      <a href="contact.html" class="nav-link">Contact</a>
    </nav>
  </div>
</header>
```

### Card Component Template
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-subtitle">Optional subtitle</p>
  </div>
  <div class="card-content">
    <!-- Card content here -->
  </div>
  <div class="card-footer">
    <!-- Optional footer content -->
  </div>
</div>
```

### Button Templates
```html
<!-- Primary Button -->
<button class="btn btn-primary">Primary Action</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">Secondary Action</button>

<!-- Outline Button -->
<button class="btn btn-outline">Outline Button</button>

<!-- Icon Button -->
<button class="btn btn-icon">
  <svg class="btn-icon-svg">...</svg>
  Button with Icon
</button>
```

### Form Element Templates
```html
<!-- Input Field -->
<div class="form-group">
  <label class="form-label">Field Label</label>
  <input type="text" class="form-input" placeholder="Enter value...">
  <span class="form-help">Helper text</span>
</div>

<!-- Select Dropdown -->
<div class="form-group">
  <label class="form-label">Select Option</label>
  <select class="form-select">
    <option value="">Choose...</option>
  </select>
</div>
```

## 5. CSS Component Styling

### Header & Navigation
```css
.main-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--gray-200);
  height: var(--header-height);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
}

.nav-link {
  color: var(--gray-700);
  text-decoration: none;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--space-2);
  transition: all 0.2s;
}

.nav-link:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.nav-link.active {
  background: var(--primary-color);
  color: white;
}
```

### Card Styling
```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--gray-200);
  border-radius: var(--space-3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--gray-200);
}

.card-content {
  padding: var(--space-6);
}
```

### Button Styling
```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border: none;
  border-radius: var(--space-2);
  font-weight: var(--font-medium);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--secondary-color);
  color: white;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
}
```

## 6. Page Layout Standards

### Page Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title - Romina Day AI</title>
  <style>/* Inline styles */</style>
</head>
<body>
  <header class="main-header"><!-- Navigation --></header>
  <main class="main-content">
    <section class="hero"><!-- Hero section --></section>
    <section class="content"><!-- Main content --></section>
  </main>
  <footer class="main-footer"><!-- Footer --></footer>
  <script>/* JavaScript */</script>
</body>
</html>
```

### Content Containers
```css
.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

.main-content {
  margin-top: var(--header-height);
  min-height: calc(100vh - var(--header-height));
}

.section {
  padding: var(--section-spacing) 0;
}
```

## 7. Interactive Elements

### Loading States
```css
.loading {
  opacity: 0.6;
  pointer-events: none;
}

.spinner {
  border: 2px solid var(--gray-200);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Data Visualization
- Use Chart.js for all charts and graphs
- Consistent color scheme matching brand palette
- Interactive hover states and tooltips
- Responsive chart sizing

## 8. Desktop-Only Specifications

- **Viewport**: Optimized for 1280px+ width
- **No Mobile**: Desktop-only design, no responsive breakpoints
- **Fixed Navigation**: Desktop-style fixed header
- **Hover States**: Rich hover interactions throughout
- **Multiple Columns**: Utilize desktop space with multi-column layouts

## 9. Content Guidelines

### Professional Tone
- Technical but accessible language
- Confidence in capabilities without overselling
- Specific examples and metrics
- Clear value propositions

### Demo Data
- Realistic financial data and metrics
- Professional company names and scenarios
- Actual charts and visualizations
- Working interactive elements

This design system ensures consistent, professional presentation across all demo pages while showcasing technical capabilities and attention to detail expected by enterprise financial services clients.