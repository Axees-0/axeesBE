# Design System - AI-Powered Music Booking Platform

## Global Navigation Structure

### Primary Navigation
- **Home** (index.html) - Main landing page with feature showcase
- **AI Booking** (booking.html) - Intelligent talent booking interface
- **Event Discovery** (discovery.html) - Conversational AI event finder
- **Admin Dashboard** (admin.html) - Management tools for venues/artists

### Navigation Behavior
- Fixed top navigation bar with logo on left, menu items centered
- Active page highlighting with primary color
- Smooth hover transitions
- Desktop-optimized spacing and typography

## Shared CSS Variables & Styling

### Color Palette
```css
:root {
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --secondary-color: #ec4899;
  --accent-color: #06b6d4;
  --background-color: #0f172a;
  --surface-color: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --border-color: #334155;
  --hover-bg: #334155;
}
```

### Typography
```css
/* Headers */
h1 { font-size: 2.5rem; font-weight: 700; color: var(--text-primary); }
h2 { font-size: 2rem; font-weight: 600; color: var(--text-primary); }
h3 { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); }
h4 { font-size: 1.25rem; font-weight: 500; color: var(--text-primary); }

/* Body Text */
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 1rem; color: var(--text-secondary); }
.text-large { font-size: 1.125rem; }
.text-small { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
```

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  padding: 10px 22px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* AI Chat Button */
.btn-ai {
  background: linear-gradient(135deg, var(--secondary-color), var(--accent-color));
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}
```

### Spacing Standards
```css
/* Margins */
.m-1 { margin: 0.25rem; }
.m-2 { margin: 0.5rem; }
.m-4 { margin: 1rem; }
.m-6 { margin: 1.5rem; }
.m-8 { margin: 2rem; }

/* Padding */
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }

/* Section Spacing */
.section-padding { padding: 4rem 2rem; }
.container-spacing { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
```

### Card & Component Styling
```css
.card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
}

.glass-card {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}
```

### Form Input Styling
```css
.form-input {
  width: 100%;
  padding: 12px 16px;
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-label {
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
}
```

## Component Templates

### Navigation Template
```html
<nav class="navbar">
  <div class="nav-container">
    <div class="nav-logo">
      <h2>🎵 MusicAI</h2>
    </div>
    <ul class="nav-menu">
      <li><a href="index.html" class="nav-link">Home</a></li>
      <li><a href="booking.html" class="nav-link">AI Booking</a></li>
      <li><a href="discovery.html" class="nav-link">Event Discovery</a></li>
      <li><a href="admin.html" class="nav-link">Admin</a></li>
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
        <h4>🎵 MusicAI</h4>
        <p>AI-powered talent booking and event discovery platform</p>
      </div>
      <div class="footer-section">
        <h5>Features</h5>
        <ul>
          <li>AI Booking Automation</li>
          <li>Event Discovery</li>
          <li>Venue Management</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2024 MusicAI Platform. All rights reserved.</p>
    </div>
  </div>
</footer>
```

### Card Component Template
```html
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-content">
    <p>Card content goes here</p>
  </div>
  <div class="card-actions">
    <button class="btn-primary">Primary Action</button>
    <button class="btn-secondary">Secondary Action</button>
  </div>
</div>
```

### AI Chat Interface Template
```html
<div class="chat-container">
  <div class="chat-header">
    <h3>🤖 AI Assistant</h3>
    <span class="status-indicator">Online</span>
  </div>
  <div class="chat-messages" id="chatMessages">
    <!-- Messages will be dynamically added here -->
  </div>
  <div class="chat-input-container">
    <input type="text" class="chat-input" placeholder="Ask AI anything..." id="chatInput">
    <button class="btn-ai" id="sendBtn">Send</button>
  </div>
</div>
```

## Page Layout Standards

### Page Wrapper
```css
.page-wrapper {
  min-height: 100vh;
  background: var(--background-color);
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 80px; /* Account for fixed navbar */
}
```

### Header Layout
```css
.hero-section {
  background: linear-gradient(135deg, var(--background-color), var(--surface-color));
  padding: 6rem 2rem;
  text-align: center;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}
```

### Grid Systems
```css
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }

/* Responsive adjustments for desktop-only */
@media (max-width: 1024px) {
  .grid-3 { grid-template-columns: 1fr 1fr; }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
}
```

## Animation & Interactions

### Hover Effects
```css
.hover-lift:hover { transform: translateY(-4px); }
.hover-scale:hover { transform: scale(1.05); }
.hover-glow:hover { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
```

### Loading States
```css
.loading-spinner {
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--primary-color);
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

## Implementation Notes

1. **All CSS must be inline or in `<style>` tags**
2. **Use relative linking between pages**
3. **Follow this design system exactly for consistency**
4. **LocalStorage for data persistence**
5. **No external dependencies or frameworks**
6. **Professional, production-ready appearance**
7. **Focus on AI/ML integration demonstration**