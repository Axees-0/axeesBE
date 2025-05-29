# Design System: AI Website Builder Demo

## 1. Global Navigation Structure

### Navigation Menu Items
- **Home** → index.html
- **Dashboard** → dashboard.html  
- **Demo** → demo.html
- **Features** → index.html#features
- **Pricing** → index.html#pricing

### Navigation Behavior (Desktop-Specific)
- Fixed top navigation bar
- Horizontal menu layout
- Hover effects with color transitions
- Active page highlighting
- Logo/brand on left, menu items center-right

### Page Linking Instructions
```html
<nav class="main-nav">
  <div class="nav-container">
    <div class="nav-brand">
      <a href="index.html">AI WebBuilder</a>
    </div>
    <ul class="nav-menu">
      <li><a href="index.html" class="nav-link">Home</a></li>
      <li><a href="dashboard.html" class="nav-link">Dashboard</a></li>
      <li><a href="demo.html" class="nav-link">Demo</a></li>
    </ul>
  </div>
</nav>
```

## 2. Shared CSS Variables & Styling

### Global CSS Custom Properties
```css
:root {
  /* Primary Colors */
  --primary-color: #2563eb;
  --primary-dark: #1d4ed8;
  --primary-light: #3b82f6;
  
  /* Secondary Colors */
  --secondary-color: #10b981;
  --secondary-dark: #059669;
  --secondary-light: #34d399;
  
  /* Neutral Colors */
  --background-color: #ffffff;
  --background-gray: #f8fafc;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border-color: #e5e7eb;
  --border-dark: #d1d5db;
  
  /* Accent Colors */
  --accent-color: #8b5cf6;
  --accent-light: #a78bfa;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Typography Definitions
```css
/* Headers */
h1 {
  font-family: 'Arial', 'Helvetica', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

h2 {
  font-family: 'Arial', 'Helvetica', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
  margin-bottom: 0.875rem;
}

h3 {
  font-family: 'Arial', 'Helvetica', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

/* Body Text */
body {
  font-family: 'Arial', 'Helvetica', sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-primary);
  background-color: var(--background-color);
}

.text-large {
  font-size: 1.125rem;
  line-height: 1.7;
}

.text-small {
  font-size: 0.875rem;
  line-height: 1.5;
}

.text-muted {
  color: var(--text-muted);
}
```

### Button Style Definitions
```css
/* Primary Button */
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background-color: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-secondary:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-1px);
}

/* Large Button */
.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

/* Small Button */
.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}
```

### Margin, Padding, and Spacing Standards
```css
/* Spacing Utilities */
.spacing-xs { margin: 0.25rem; }
.spacing-sm { margin: 0.5rem; }
.spacing-md { margin: 1rem; }
.spacing-lg { margin: 1.5rem; }
.spacing-xl { margin: 2rem; }
.spacing-2xl { margin: 3rem; }

/* Padding Utilities */
.padding-xs { padding: 0.25rem; }
.padding-sm { padding: 0.5rem; }
.padding-md { padding: 1rem; }
.padding-lg { padding: 1.5rem; }
.padding-xl { padding: 2rem; }
.padding-2xl { padding: 3rem; }

/* Section Spacing */
.section-padding {
  padding: 4rem 0;
}

.container-padding {
  padding: 0 2rem;
}
```

### Card and Component Styling Guidelines
```css
/* Card Component */
.card {
  background-color: var(--background-color);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.card-content {
  color: var(--text-secondary);
}

/* Feature Card */
.feature-card {
  text-align: center;
  padding: 2rem;
  background: var(--background-gray);
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.feature-card:hover {
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-light);
}
```

### Form Input Styling Standards
```css
/* Form Elements */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  background-color: var(--background-color);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5rem 1.5rem;
  padding-right: 2.5rem;
}
```

## 3. Component Templates

### Navigation Template
```html
<nav class="main-nav">
  <div class="nav-container">
    <div class="nav-brand">
      <a href="index.html">
        <span class="brand-text">AI WebBuilder</span>
      </a>
    </div>
    <ul class="nav-menu">
      <li class="nav-item">
        <a href="index.html" class="nav-link">Home</a>
      </li>
      <li class="nav-item">
        <a href="dashboard.html" class="nav-link">Dashboard</a>
      </li>
      <li class="nav-item">
        <a href="demo.html" class="nav-link">Demo</a>
      </li>
    </ul>
    <div class="nav-actions">
      <a href="demo.html" class="btn-primary btn-small">Try Demo</a>
    </div>
  </div>
</nav>
```

### Footer Template
```html
<footer class="main-footer">
  <div class="footer-container">
    <div class="footer-content">
      <div class="footer-brand">
        <h3>AI WebBuilder</h3>
        <p>Generate full-stack web applications from natural language prompts.</p>
      </div>
      <div class="footer-links">
        <div class="link-group">
          <h4>Product</h4>
          <a href="index.html#features">Features</a>
          <a href="demo.html">Demo</a>
          <a href="dashboard.html">Dashboard</a>
        </div>
        <div class="link-group">
          <h4>Company</h4>
          <a href="index.html#about">About</a>
          <a href="index.html#contact">Contact</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2024 AI WebBuilder. All rights reserved.</p>
    </div>
  </div>
</footer>
```

### Card Component HTML Structure
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
  </div>
  <div class="card-content">
    <p>Card content goes here.</p>
  </div>
  <div class="card-actions">
    <button class="btn-primary">Action</button>
  </div>
</div>
```

### Button HTML Templates
```html
<!-- Primary Button -->
<button class="btn-primary">Primary Action</button>
<a href="#" class="btn-primary">Primary Link</a>

<!-- Secondary Button -->
<button class="btn-secondary">Secondary Action</button>

<!-- Large Button -->
<button class="btn-primary btn-large">Large Button</button>

<!-- Small Button -->
<button class="btn-primary btn-small">Small Button</button>
```

### Form Element Templates
```html
<div class="form-group">
  <label for="input-id" class="form-label">Label Text</label>
  <input type="text" id="input-id" class="form-input" placeholder="Placeholder text">
</div>

<div class="form-group">
  <label for="textarea-id" class="form-label">Description</label>
  <textarea id="textarea-id" class="form-input form-textarea" placeholder="Enter description"></textarea>
</div>

<div class="form-group">
  <label for="select-id" class="form-label">Select Option</label>
  <select id="select-id" class="form-input form-select">
    <option value="">Choose option</option>
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
  </select>
</div>
```

## 4. Page Layout Standards

### Page Wrapper/Container Specifications
```css
/* Main Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.container-fluid {
  width: 100%;
  padding: 0 2rem;
}

/* Page Wrapper */
.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 80px; /* Account for fixed nav */
}
```

### Responsive Breakpoints (Desktop-Only)
```css
/* Desktop Large */
@media (min-width: 1200px) {
  .container {
    max-width: 1200px;
  }
}

/* Desktop Standard */
@media (min-width: 992px) and (max-width: 1199px) {
  .container {
    max-width: 960px;
  }
}

/* Desktop Small */
@media (min-width: 768px) and (max-width: 991px) {
  .container {
    max-width: 720px;
  }
  
  .nav-menu {
    gap: 1rem;
  }
}
```

### Header, Main Content, Footer Layout Instructions
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title - AI WebBuilder</title>
</head>
<body>
  <div class="page-wrapper">
    <!-- Fixed Navigation Header -->
    <header class="site-header">
      <!-- Navigation component here -->
    </header>
    
    <!-- Main Content Area -->
    <main class="main-content">
      <div class="container">
        <!-- Page-specific content -->
      </div>
    </main>
    
    <!-- Site Footer -->
    <footer class="main-footer">
      <!-- Footer component here -->
    </footer>
  </div>
</body>
</html>
```

### Common Layout Patterns
```css
/* Hero Section */
.hero-section {
  padding: 6rem 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  text-align: center;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 4rem 0;
}

/* Two Column Layout */
.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

/* Three Column Layout */
.three-column {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
```

## Navigation & Component Integration Rules

1. **Consistent Navigation**: Every page must include the same navigation structure
2. **Active States**: Highlight current page in navigation
3. **Responsive Behavior**: Maintain desktop-focused responsive design
4. **Component Reuse**: Use identical component HTML structure across pages
5. **Style Inheritance**: All pages inherit from the same CSS variable system
6. **Interaction Patterns**: Consistent hover effects and transitions
7. **Content Hierarchy**: Follow established typography scale
8. **Spacing Consistency**: Use standardized margin/padding utilities