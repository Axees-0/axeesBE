# AWS Data Pipeline Demo - Design System

## Project Overview
This demo showcases an AWS-based data pipeline automation solution that transforms a 15-year-old manual process into a modern, automated workflow. The system demonstrates automated email attachment retrieval, S3 storage, AWS Glue transformations, data lake management, and automated reporting.

## Branding Elements

### Color Palette
```css
/* AWS-Inspired Professional Colors */
--primary-color: #FF9900;        /* AWS Orange */
--secondary-color: #232F3E;      /* AWS Dark Blue */
--accent-color: #146EB4;         /* AWS Light Blue */
--success-color: #1B660F;        /* Green for success states */
--warning-color: #D13212;        /* Red for alerts */
--background-color: #FFFFFF;     /* White background */
--surface-color: #F2F3F3;        /* Light gray surfaces */
--text-primary: #16191F;         /* Dark text */
--text-secondary: #545B64;       /* Medium gray text */
--border-color: #D5DBDB;         /* Light borders */
```

### Typography
```css
/* Professional AWS-style Typography */
--font-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;

/* Font Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing Standards
```css
/* Consistent Spacing System */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;
```

## Component Specifications

### Navigation Header
```html
<header class="aws-header">
    <div class="container">
        <div class="header-content">
            <div class="logo-section">
                <svg class="aws-logo" width="40" height="24" viewBox="0 0 40 24">
                    <!-- AWS-style logo -->
                </svg>
                <h1 class="site-title">AWS Pipeline Automation</h1>
            </div>
            <nav class="main-nav">
                <a href="index.html" class="nav-link">Overview</a>
                <a href="pipeline-dashboard.html" class="nav-link">Pipeline Dashboard</a>
                <a href="data-transformation.html" class="nav-link">Data Transformation</a>
                <a href="reporting.html" class="nav-link">Reporting</a>
            </nav>
        </div>
    </div>
</header>
```

### Card Component
```html
<div class="aws-card">
    <div class="card-header">
        <h3 class="card-title">Card Title</h3>
        <span class="card-badge">Status</span>
    </div>
    <div class="card-body">
        <!-- Content -->
    </div>
    <div class="card-footer">
        <button class="btn btn-primary">Action</button>
    </div>
</div>
```

### Button Styles
```html
<!-- Primary Button -->
<button class="btn btn-primary">
    <span class="btn-text">Primary Action</span>
    <svg class="btn-icon"><!-- Icon --></svg>
</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">Secondary Action</button>

<!-- Success Button -->
<button class="btn btn-success">Success Action</button>

<!-- Danger Button -->
<button class="btn btn-danger">Delete</button>
```

### Form Elements
```html
<div class="form-group">
    <label class="form-label">Field Label</label>
    <input type="text" class="form-input" placeholder="Enter value">
    <span class="form-help">Helper text for this field</span>
</div>

<div class="form-group">
    <label class="form-label">Select Option</label>
    <select class="form-select">
        <option>Option 1</option>
        <option>Option 2</option>
    </select>
</div>
```

### Status Indicators
```html
<!-- Pipeline Status -->
<div class="status-indicator status-running">
    <span class="status-dot"></span>
    <span class="status-text">Running</span>
</div>

<div class="status-indicator status-success">
    <span class="status-dot"></span>
    <span class="status-text">Completed</span>
</div>

<div class="status-indicator status-error">
    <span class="status-dot"></span>
    <span class="status-text">Failed</span>
</div>
```

## Page Layout Standards

### Container Structure
```css
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-lg);
}

.page-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.main-content {
    flex: 1;
    padding: var(--space-2xl) 0;
}
```

### Grid System
```css
.grid {
    display: grid;
    gap: var(--space-lg);
}

.grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
}

.grid-cols-4 {
    grid-template-columns: repeat(4, 1fr);
}
```

## AWS Service Icons
Include these service representations:
- S3 Bucket (orange storage icon)
- AWS Glue (purple ETL icon)
- Lambda (orange function icon)
- RDS/DynamoDB (blue database icon)
- CloudWatch (pink monitoring icon)
- SES (orange email icon)

## Interactive Elements

### Loading States
```html
<div class="loading-spinner">
    <div class="spinner"></div>
    <span class="loading-text">Processing...</span>
</div>
```

### Progress Indicators
```html
<div class="progress-bar">
    <div class="progress-fill" style="width: 60%"></div>
    <span class="progress-text">60% Complete</span>
</div>
```

### Notification Styles
```html
<div class="notification notification-success">
    <svg class="notification-icon"><!-- Success icon --></svg>
    <div class="notification-content">
        <h4 class="notification-title">Success</h4>
        <p class="notification-message">Pipeline executed successfully</p>
    </div>
    <button class="notification-close">&times;</button>
</div>
```

## Data Visualization Standards
- Use Chart.js for all charts
- Primary color for main data series
- Secondary colors for comparative data
- Consistent tooltips and legends
- Animated transitions on data updates

## Animation Guidelines
```css
/* Standard transitions */
transition: all 0.2s ease;
transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Hover effects */
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

## Responsive Breakpoints (Desktop-Only Focus)
```css
/* Minimum supported width */
@media (min-width: 1024px) {
    /* Desktop styles */
}

/* Large desktop */
@media (min-width: 1440px) {
    /* Enhanced spacing and layouts */
}
```

## Footer Template
```html
<footer class="aws-footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <h4>AWS Pipeline Demo</h4>
                <p>Automated data pipeline solution built on AWS</p>
            </div>
            <div class="footer-section">
                <h4>Key Features</h4>
                <ul>
                    <li>Email Attachment Processing</li>
                    <li>S3 Storage Management</li>
                    <li>AWS Glue Transformations</li>
                    <li>Automated Reporting</li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Technologies</h4>
                <ul>
                    <li>AWS S3</li>
                    <li>AWS Glue</li>
                    <li>AWS Lambda</li>
                    <li>AWS RDS</li>
                </ul>
            </div>
        </div>
    </div>
</footer>
```