# DESIGN SYSTEM: Photo Comparison Software Demo

## Brand Identity

### Application Name
**CompareVision Pro** - Professional Image Comparison Software

### Logo & Branding
- **Logo Position**: Top-left of navigation bar
- **Logo Style**: Modern icon with text
- **Brand Mark**: Overlapping circles suggesting comparison
- **Tagline**: "Precision Image Analysis for Static Objects"

## Color Palette

### Primary Colors
```css
--primary-blue: #2563eb;      /* Main brand color */
--primary-dark: #1e40af;      /* Hover states */
--primary-light: #3b82f6;     /* Active states */
```

### Secondary Colors
```css
--secondary-green: #10b981;   /* Success states */
--secondary-orange: #f59e0b;  /* Warnings */
--secondary-red: #ef4444;     /* Errors */
```

### Neutral Colors
```css
--neutral-50: #f9fafb;        /* Light backgrounds */
--neutral-100: #f3f4f6;       /* Card backgrounds */
--neutral-200: #e5e7eb;       /* Borders */
--neutral-300: #d1d5db;       /* Disabled states */
--neutral-400: #9ca3af;       /* Placeholder text */
--neutral-500: #6b7280;       /* Secondary text */
--neutral-600: #4b5563;       /* Body text */
--neutral-700: #374151;       /* Headings */
--neutral-800: #1f2937;       /* Dark text */
--neutral-900: #111827;       /* Darkest text */
```

### Gradient Definitions
```css
--gradient-primary: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
--gradient-hero: linear-gradient(180deg, #f9fafb 0%, #e5e7eb 100%);
--gradient-dark: linear-gradient(135deg, #1f2937 0%, #374151 100%);
```

## Typography

### Font Families
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
--font-mono: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
```

### Font Sizes
```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

## Spacing System

### Base Spacing
```css
--space-0: 0;
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
```

## Component Styles

### Buttons

#### Primary Button
```css
.btn-primary {
    background: var(--primary-blue);
    color: white;
    padding: var(--space-3) var(--space-6);
    border-radius: 0.5rem;
    font-weight: var(--font-medium);
    font-size: var(--text-base);
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
}

.btn-primary:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.btn-primary:active {
    transform: translateY(0);
}
```

#### Secondary Button
```css
.btn-secondary {
    background: white;
    color: var(--primary-blue);
    padding: var(--space-3) var(--space-6);
    border-radius: 0.5rem;
    font-weight: var(--font-medium);
    font-size: var(--text-base);
    border: 2px solid var(--primary-blue);
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-secondary:hover {
    background: var(--primary-blue);
    color: white;
}
```

#### Icon Button
```css
.btn-icon {
    background: var(--neutral-100);
    color: var(--neutral-700);
    padding: var(--space-2);
    border-radius: 0.375rem;
    border: 1px solid var(--neutral-200);
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-icon:hover {
    background: var(--neutral-200);
    border-color: var(--neutral-300);
}
```

### Cards

```css
.card {
    background: white;
    border-radius: 0.75rem;
    padding: var(--space-6);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--neutral-200);
}

.card-hover {
    transition: all 0.3s ease;
    cursor: pointer;
}

.card-hover:hover {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}
```

### Form Elements

#### Input Fields
```css
.input {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--neutral-300);
    border-radius: 0.5rem;
    font-size: var(--text-base);
    background: white;
    transition: all 0.2s ease;
}

.input:focus {
    outline: none;
    border-color: var(--primary-blue);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-error {
    border-color: var(--secondary-red);
}
```

#### File Upload
```css
.upload-area {
    border: 2px dashed var(--neutral-300);
    border-radius: 0.75rem;
    padding: var(--space-8);
    text-align: center;
    background: var(--neutral-50);
    transition: all 0.3s ease;
    cursor: pointer;
}

.upload-area:hover {
    border-color: var(--primary-blue);
    background: white;
}

.upload-area.drag-over {
    border-color: var(--primary-blue);
    background: rgba(37, 99, 235, 0.05);
}
```

### Navigation

```css
.nav {
    background: white;
    border-bottom: 1px solid var(--neutral-200);
    padding: var(--space-4) 0;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
}

.nav-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 var(--space-6);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-links {
    display: flex;
    gap: var(--space-8);
}

.nav-link {
    color: var(--neutral-600);
    text-decoration: none;
    font-weight: var(--font-medium);
    transition: color 0.2s ease;
}

.nav-link:hover {
    color: var(--primary-blue);
}

.nav-link.active {
    color: var(--primary-blue);
}
```

## Layout Standards

### Page Container
```css
.container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 var(--space-6);
}

.main-content {
    padding-top: calc(64px + var(--space-8)); /* Nav height + spacing */
    padding-bottom: var(--space-16);
    min-height: 100vh;
}
```

### Grid System
```css
.grid {
    display: grid;
    gap: var(--space-6);
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

### Flex Utilities
```css
.flex {
    display: flex;
}

.flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
}

.flex-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
```

## Animation & Transitions

### Standard Transitions
```css
--transition-fast: 0.15s ease;
--transition-base: 0.2s ease;
--transition-slow: 0.3s ease;
```

### Loading States
```css
@keyframes spin {
    to { transform: rotate(360deg); }
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--neutral-300);
    border-top-color: var(--primary-blue);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.skeleton {
    background: var(--neutral-200);
    border-radius: 0.25rem;
    animation: pulse 1.5s ease-in-out infinite;
}
```

## Component Templates

### Navigation HTML
```html
<nav class="nav">
    <div class="nav-container">
        <div class="nav-brand">
            <div class="logo">
                <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="12" cy="16" r="10" fill="#2563eb" opacity="0.8"/>
                    <circle cx="20" cy="16" r="10" fill="#3b82f6" opacity="0.8"/>
                </svg>
                <span class="logo-text">CompareVision Pro</span>
            </div>
        </div>
        <div class="nav-links">
            <a href="index.html" class="nav-link">Home</a>
            <a href="compare.html" class="nav-link">Compare</a>
            <a href="results.html" class="nav-link">Results</a>
            <a href="history.html" class="nav-link">History</a>
            <a href="about.html" class="nav-link">About</a>
        </div>
    </div>
</nav>
```

### Card Component HTML
```html
<div class="card card-hover">
    <div class="card-header">
        <h3 class="card-title">Card Title</h3>
        <span class="card-badge">New</span>
    </div>
    <div class="card-body">
        <p class="card-text">Card content goes here...</p>
    </div>
    <div class="card-footer">
        <button class="btn-primary">Action</button>
    </div>
</div>
```

### Upload Area HTML
```html
<div class="upload-area" id="uploadArea">
    <svg class="upload-icon" width="48" height="48">
        <!-- Upload icon SVG -->
    </svg>
    <p class="upload-text">Drag & drop your image here</p>
    <p class="upload-subtext">or</p>
    <button class="btn-primary">Browse Files</button>
    <input type="file" class="upload-input" accept="image/*" hidden>
</div>
```

## Global CSS Reset & Base Styles

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: var(--leading-normal);
    color: var(--neutral-700);
    background: var(--neutral-50);
}

body {
    min-height: 100vh;
    overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 {
    color: var(--neutral-800);
    font-weight: var(--font-bold);
    line-height: var(--leading-tight);
    margin-bottom: var(--space-4);
}

h1 { font-size: var(--text-4xl); }
h2 { font-size: var(--text-3xl); }
h3 { font-size: var(--text-2xl); }
h4 { font-size: var(--text-xl); }
h5 { font-size: var(--text-lg); }
h6 { font-size: var(--text-base); }

p {
    margin-bottom: var(--space-4);
}

a {
    color: var(--primary-blue);
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

img {
    max-width: 100%;
    height: auto;
    display: block;
}
```

## Implementation Notes

1. **Consistency**: All pages must use these exact styles
2. **No External Dependencies**: All styles must be inline or in `<style>` tags
3. **Desktop-Only**: Optimize for 1280px+ screens
4. **Professional Polish**: Use subtle shadows and smooth transitions
5. **Brand Colors**: Primary blue should dominate with neutral grays
6. **Loading States**: Always show spinners for async operations
7. **Error States**: Use red borders and helpful error messages
8. **Success States**: Use green colors for positive feedback

This design system ensures a cohesive, professional appearance across all demo pages.