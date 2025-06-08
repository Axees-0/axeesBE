# DESIGN SYSTEM: MVP Design Converter Pro

## 1. Global Navigation Structure

### Main Navigation Items
- **Home** → index.html
- **Upload Design** → upload.html
- **Dashboard** → dashboard.html
- **Preview** → preview.html
- **Export** → export.html

### Navigation Behavior
- Fixed header navigation
- Active state highlighting
- Smooth hover transitions
- Consistent across all pages

## 2. Shared CSS Variables & Styling

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-color: #6366F1;
  --primary-hover: #4F46E5;
  --primary-light: #E0E7FF;
  
  /* Secondary Colors */
  --secondary-color: #10B981;
  --secondary-hover: #059669;
  --secondary-light: #D1FAE5;
  
  /* Accent Colors */
  --accent-color: #F59E0B;
  --accent-hover: #D97706;
  --accent-light: #FEF3C7;
  
  /* Neutral Colors */
  --background: #F9FAFB;
  --surface: #FFFFFF;
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --border-color: #E5E7EB;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

### Typography
```css
/* Headers */
h1 {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.2;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

h2 {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
  margin-bottom: 1.25rem;
}

h3 {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

/* Body Text */
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-primary);
}

p {
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

/* Code */
code, pre {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
  background-color: #F3F4F6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
```

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Secondary Button */
.btn-secondary {
  background-color: var(--surface);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* Success Button */
.btn-success {
  background-color: var(--secondary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-success:hover {
  background-color: var(--secondary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

### Spacing Standards
```css
/* Margins */
.m-0 { margin: 0; }
.m-1 { margin: 0.5rem; }
.m-2 { margin: 1rem; }
.m-3 { margin: 1.5rem; }
.m-4 { margin: 2rem; }
.m-5 { margin: 3rem; }

/* Padding */
.p-0 { padding: 0; }
.p-1 { padding: 0.5rem; }
.p-2 { padding: 1rem; }
.p-3 { padding: 1.5rem; }
.p-4 { padding: 2rem; }
.p-5 { padding: 3rem; }

/* Section Spacing */
section {
  padding: 4rem 0;
}
```

### Card Styles
```css
.card {
  background-color: var(--surface);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.card-body {
  color: var(--text-secondary);
}

.card-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
```

### Form Styles
```css
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  background-color: var(--surface);
  cursor: pointer;
}
```

## 3. Component Templates

### Navigation HTML
```html
<nav class="navbar">
  <div class="container">
    <div class="nav-brand">
      <a href="index.html">
        <h2>MVP Converter Pro</h2>
      </a>
    </div>
    <ul class="nav-menu">
      <li><a href="index.html" class="nav-link">Home</a></li>
      <li><a href="upload.html" class="nav-link">Upload Design</a></li>
      <li><a href="dashboard.html" class="nav-link">Dashboard</a></li>
      <li><a href="preview.html" class="nav-link">Preview</a></li>
      <li><a href="export.html" class="nav-link">Export</a></li>
    </ul>
  </div>
</nav>
```

### Footer HTML
```html
<footer class="footer">
  <div class="container">
    <div class="footer-content">
      <div class="footer-section">
        <h3>MVP Converter Pro</h3>
        <p>Transform your mobile designs into functional MVPs with ease.</p>
      </div>
      <div class="footer-section">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="upload.html">Start Converting</a></li>
          <li><a href="dashboard.html">Dashboard</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4>Features</h4>
        <ul>
          <li>Design Analysis</li>
          <li>Code Generation</li>
          <li>Live Preview</li>
          <li>Export Options</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2025 MVP Converter Pro. Professional Demo.</p>
    </div>
  </div>
</footer>
```

### Card Component HTML
```html
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-body">
    <p>Card content goes here...</p>
  </div>
  <div class="card-footer">
    <button class="btn-primary">Action</button>
  </div>
</div>
```

### Button Templates
```html
<!-- Primary Button -->
<button class="btn-primary">Get Started</button>

<!-- Secondary Button -->
<button class="btn-secondary">Learn More</button>

<!-- Success Button -->
<button class="btn-success">Complete</button>

<!-- Button with Icon -->
<button class="btn-primary">
  <span class="icon">→</span> Continue
</button>
```

### Form Templates
```html
<form class="form">
  <div class="form-group">
    <label class="form-label">Field Label</label>
    <input type="text" class="form-input" placeholder="Enter value...">
  </div>
  
  <div class="form-group">
    <label class="form-label">Select Option</label>
    <select class="form-select">
      <option>Option 1</option>
      <option>Option 2</option>
      <option>Option 3</option>
    </select>
  </div>
  
  <button type="submit" class="btn-primary">Submit</button>
</form>
```

## 4. Page Layout Standards

### Container Specifications
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.container-fluid {
  width: 100%;
  padding: 0 2rem;
}
```

### Page Structure
```css
/* Page Wrapper */
.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--background);
}

/* Header */
.navbar {
  background-color: var(--surface);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 1rem 0;
}

/* Main Content */
main {
  flex: 1;
  padding: 2rem 0;
}

/* Footer */
.footer {
  background-color: var(--text-primary);
  color: white;
  padding: 3rem 0 1rem;
  margin-top: 4rem;
}
```

### Grid System
```css
.grid {
  display: grid;
  gap: 2rem;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}
```

### Utility Classes
```css
/* Text Alignment */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

/* Display */
.d-none { display: none; }
.d-block { display: block; }
.d-flex { display: flex; }
.d-grid { display: grid; }

/* Flexbox */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

## Implementation Notes

1. All pages must include the navigation and footer templates
2. Use CSS variables consistently throughout all pages
3. Maintain consistent spacing using the defined classes
4. Apply hover states and transitions for interactivity
5. Ensure all forms follow the defined styling
6. Use the card component for content sections
7. Apply the grid system for layouts
8. Desktop-only focus (1280px viewport)
9. Use inline styles or `<style>` tags in HTML files
10. No external CSS files - all styling embedded in HTML