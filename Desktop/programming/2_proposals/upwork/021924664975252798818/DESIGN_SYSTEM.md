# DESIGN SYSTEM: RoomStyle AI - Room Design & Shopping Platform

## Brand Identity
**App Name**: RoomStyle AI
**Tagline**: Transform Your Space with AI-Powered Design

## Color Palette

### Primary Colors
```css
--primary-color: #2C3E50;        /* Deep Navy - Professional, trustworthy */
--primary-hover: #34495E;        /* Lighter Navy - Hover state */
--primary-light: #ECF0F1;        /* Light Gray - Backgrounds */

### Secondary Colors
--secondary-color: #3498DB;      /* Bright Blue - CTAs, accents */
--secondary-hover: #2980B9;      /* Darker Blue - Hover state */
--accent-color: #E74C3C;         /* Coral Red - Important actions */
--success-color: #27AE60;        /* Green - Success states */
--warning-color: #F39C12;        /* Orange - Warnings */

### Neutral Colors
--text-primary: #2C3E50;         /* Dark text */
--text-secondary: #7F8C8D;       /* Muted text */
--text-light: #FFFFFF;           /* White text */
--background: #FFFFFF;           /* Main background */
--background-alt: #F8F9FA;       /* Alternate background */
--border-color: #E0E0E0;         /* Borders */
--shadow-color: rgba(0,0,0,0.1); /* Shadows */
```

## Typography

### Font Stack
```css
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'Monaco', 'Consolas', 'Courier New', monospace;
```

### Font Sizes
```css
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 24px;
--font-size-2xl: 32px;
--font-size-3xl: 48px;
```

### Font Weights
```css
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

## Layout Standards

### Container Widths
```css
--container-max: 1400px;
--container-content: 1200px;
--container-narrow: 800px;
```

### Border Radius
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 16px;
--radius-full: 50%;
```

### Shadows
```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1);
```

## Component Standards

### Navigation Header
```html
<header class="nav-header">
    <div class="nav-container">
        <div class="nav-brand">
            <h1 class="brand-logo">RoomStyle AI</h1>
        </div>
        <nav class="nav-menu">
            <a href="index.html" class="nav-link active">Home</a>
            <a href="design.html" class="nav-link">Design Studio</a>
            <a href="shop.html" class="nav-link">Shop</a>
            <a href="checkout.html" class="nav-link cart-link">
                Cart <span class="cart-count">0</span>
            </a>
        </nav>
    </div>
</header>
```

### Button Styles
```css
/* Primary Button */
.btn-primary {
    background: var(--secondary-color);
    color: white;
    padding: 12px 24px;
    border-radius: var(--radius-md);
    font-weight: var(--font-semibold);
    transition: all 0.3s ease;
}

/* Secondary Button */
.btn-secondary {
    background: white;
    color: var(--primary-color);
    border: 2px solid var(--border-color);
    padding: 10px 22px;
}

/* Icon Button */
.btn-icon {
    background: var(--background-alt);
    padding: 8px;
    border-radius: var(--radius-md);
}
```

### Card Component
```html
<div class="card">
    <div class="card-image">
        <img src="..." alt="...">
    </div>
    <div class="card-content">
        <h3 class="card-title">Card Title</h3>
        <p class="card-description">Description text</p>
        <div class="card-footer">
            <span class="card-price">$299</span>
            <button class="btn-primary">Add to Cart</button>
        </div>
    </div>
</div>
```

### Form Elements
```css
/* Input Fields */
.form-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
}

/* Form Groups */
.form-group {
    margin-bottom: var(--spacing-lg);
}

.form-label {
    display: block;
    margin-bottom: var(--spacing-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
}
```

### Grid System
```css
.grid {
    display: grid;
    gap: var(--spacing-lg);
}

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
```

## Page Layouts

### Standard Page Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - RoomStyle AI</title>
    <style>
        /* Global CSS Variables */
        :root {
            /* Color palette defined above */
        }
        
        /* Base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-primary);
            color: var(--text-primary);
            background: var(--background);
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <!-- Navigation Header -->
    <header class="nav-header">...</header>
    
    <!-- Main Content -->
    <main class="main-content">
        <div class="container">
            <!-- Page content -->
        </div>
    </main>
    
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <p>&copy; 2025 RoomStyle AI. Transform Your Space with AI.</p>
        </div>
    </footer>
    
    <script>
        // Page-specific JavaScript
    </script>
</body>
</html>
```

## Interactive States

### Hover Effects
```css
/* Link hover */
a:hover {
    opacity: 0.8;
    transition: opacity 0.3s ease;
}

/* Button hover */
.btn-primary:hover {
    background: var(--secondary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

/* Card hover */
.card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    transition: all 0.3s ease;
}
```

### Loading States
```css
.loading {
    position: relative;
    pointer-events: none;
    opacity: 0.6;
}

.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    border: 2px solid var(--primary-color);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

### Success/Error States
```css
.alert {
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-lg);
}

.alert-success {
    background: #D4EDDA;
    color: #155724;
    border: 1px solid #C3E6CB;
}

.alert-error {
    background: #F8D7DA;
    color: #721C24;
    border: 1px solid #F5C6CB;
}
```

## Responsive Utilities
```css
.container {
    width: 100%;
    max-width: var(--container-max);
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
}

.flex {
    display: flex;
}

.flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
}

.text-center {
    text-align: center;
}

.hidden {
    display: none;
}
```

## Animation Guidelines
- Use CSS transitions for simple state changes (0.3s ease)
- Keep animations subtle and professional
- Add loading states for async operations
- Use transform and opacity for performance
- Disable animations for prefers-reduced-motion

## Accessibility Standards
- Maintain WCAG AA contrast ratios
- Include focus states for all interactive elements
- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation works

## Implementation Notes
1. All pages must include the global CSS variables
2. Follow the component structure exactly
3. Use consistent spacing throughout
4. Maintain the professional, modern aesthetic
5. Test all interactive states before finalizing