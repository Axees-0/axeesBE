# Healthcare GNN Demo - Design System

## Global Navigation Structure

### Primary Navigation Menu
- **Home** → index.html (Dashboard overview)
- **GNN Network** → gnn-demo.html (Interactive graph visualization)
- **Episode Predictions** → dashboard.html (Prediction analytics)
- **Claims Analysis** → claims.html (Medical claims data)
- **About** → about.html (Capabilities & methodology)

### Navigation Behavior
- Fixed top navigation bar across all pages
- Active page highlighting with medical blue accent
- Smooth transitions between pages
- Logo/brand placement: top-left corner
- Navigation items: centered in header

## Healthcare-Appropriate Color Palette

### Primary Colors
```css
:root {
  /* Medical Blues - Trust, Professionalism */
  --primary-blue: #2563eb;
  --primary-blue-dark: #1d4ed8;
  --primary-blue-light: #3b82f6;
  
  /* Medical Greens - Health, Safety */
  --success-green: #16a34a;
  --success-green-light: #22c55e;
  
  /* Alert Colors - Clinical Urgency */
  --warning-amber: #f59e0b;
  --danger-red: #dc2626;
  --critical-red: #b91c1c;
  
  /* Neutral Healthcare Grays */
  --neutral-50: #f9fafb;
  --neutral-100: #f3f4f6;
  --neutral-200: #e5e7eb;
  --neutral-300: #d1d5db;
  --neutral-600: #4b5563;
  --neutral-700: #374151;
  --neutral-800: #1f2937;
  --neutral-900: #111827;
  
  /* Background Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-accent: #eff6ff;
}
```

### Status Indicator Colors
```css
:root {
  /* Episode Risk Levels */
  --risk-low: #22c55e;      /* Green - Low risk */
  --risk-medium: #f59e0b;   /* Amber - Medium risk */
  --risk-high: #dc2626;     /* Red - High risk */
  --risk-critical: #7c2d12; /* Dark red - Critical */
  
  /* Prediction Confidence */
  --confidence-high: #2563eb;
  --confidence-medium: #6366f1;
  --confidence-low: #8b5cf6;
}
```

## Typography System

### Font Families
```css
:root {
  /* Primary: Professional, medical-grade readability */
  --font-primary: 'Segoe UI', system-ui, -apple-system, sans-serif;
  
  /* Monospace: Data, codes, technical content */
  --font-mono: 'Consolas', 'Monaco', 'Courier New', monospace;
  
  /* Medical data tables */
  --font-data: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Typography Scale
```css
:root {
  /* Headers */
  --text-5xl: 3rem;     /* 48px - Page titles */
  --text-4xl: 2.25rem;  /* 36px - Section headers */
  --text-3xl: 1.875rem; /* 30px - Component titles */
  --text-2xl: 1.5rem;   /* 24px - Card headers */
  --text-xl: 1.25rem;   /* 20px - Subheadings */
  --text-lg: 1.125rem;  /* 18px - Large body text */
  
  /* Body & Interface */
  --text-base: 1rem;    /* 16px - Default body */
  --text-sm: 0.875rem;  /* 14px - Labels, captions */
  --text-xs: 0.75rem;   /* 12px - Timestamps, metadata */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Text Styles
```css
.heading-primary {
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--neutral-900);
  line-height: var(--leading-tight);
  margin-bottom: 1rem;
}

.heading-secondary {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--neutral-800);
  line-height: var(--leading-normal);
}

.body-text {
  font-size: var(--text-base);
  color: var(--neutral-700);
  line-height: var(--leading-relaxed);
}

.medical-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## Component Standards

### Button Styles
```css
.btn-primary {
  background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark));
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: var(--text-base);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-blue-dark), var(--primary-blue));
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--primary-blue);
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--primary-blue);
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger {
  background: var(--danger-red);
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: var(--text-sm);
}
```

### Card Components
```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--neutral-200);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  border-bottom: 1px solid var(--neutral-200);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.medical-card {
  border-left: 4px solid var(--primary-blue);
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-accent));
}

.alert-card {
  border-left: 4px solid var(--danger-red);
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
}
```

### Form Elements
```css
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--neutral-300);
  border-radius: 0.5rem;
  font-size: var(--text-base);
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--neutral-700);
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
```

### Medical Data Tables
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-data);
  font-size: var(--text-sm);
}

.data-table th {
  background: var(--neutral-50);
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--neutral-700);
  border-bottom: 2px solid var(--neutral-200);
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--neutral-200);
  vertical-align: top;
}

.data-table tbody tr:hover {
  background: var(--bg-accent);
}

.medical-code {
  font-family: var(--font-mono);
  background: var(--neutral-100);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: var(--text-xs);
}
```

## Layout Standards

### Page Structure Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Healthcare GNN - [Page Title]</title>
    <style>
        /* Global CSS variables and base styles here */
    </style>
</head>
<body>
    <header class="main-header">
        <nav class="main-nav">
            <!-- Navigation menu -->
        </nav>
    </header>
    
    <main class="main-content">
        <!-- Page-specific content -->
    </main>
    
    <footer class="main-footer">
        <!-- Footer content if needed -->
    </footer>
    
    <script>
        // Page-specific JavaScript
    </script>
</body>
</html>
```

### Grid System
```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }

.flex {
  display: flex;
  gap: 1rem;
}

.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
```

### Header Layout
```css
.main-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--neutral-200);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.main-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.nav-brand {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--primary-blue);
  text-decoration: none;
}

.nav-menu {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  color: var(--neutral-700);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.active {
  background: var(--bg-accent);
  color: var(--primary-blue);
}
```

## Chart and Visualization Standards

### Chart Color Palette
```css
:root {
  /* Graph Network Colors */
  --node-patient: #3b82f6;
  --node-provider: #16a34a;
  --node-procedure: #f59e0b;
  --node-diagnosis: #dc2626;
  
  /* Chart Series Colors */
  --chart-primary: #2563eb;
  --chart-secondary: #16a34a;
  --chart-tertiary: #f59e0b;
  --chart-quaternary: #dc2626;
  --chart-accent: #8b5cf6;
}
```

### Loading States
```css
.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--neutral-200);
  border-top: 2px solid var(--primary-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.skeleton {
  background: linear-gradient(90deg, var(--neutral-200) 25%, var(--neutral-100) 50%, var(--neutral-200) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Professional Medical UI Patterns

### Status Badges
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-low { 
  background: #dcfce7; 
  color: #166534; 
}

.status-medium { 
  background: #fef3c7; 
  color: #92400e; 
}

.status-high { 
  background: #fee2e2; 
  color: #991b1b; 
}

.status-critical { 
  background: #fecaca; 
  color: #7f1d1d; 
}
```

### Medical Metric Cards
```css
.metric-card {
  background: var(--bg-primary);
  border: 1px solid var(--neutral-200);
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
}

.metric-value {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--primary-blue);
  margin-bottom: 0.5rem;
}

.metric-label {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  font-weight: 500;
}

.metric-trend {
  font-size: var(--text-xs);
  margin-top: 0.5rem;
}

.trend-up { color: var(--success-green); }
.trend-down { color: var(--danger-red); }
```

This design system ensures consistency across all pages while maintaining the professional, medical-grade aesthetic appropriate for a $35,000 healthcare ML project proposal.