# ERP System Demo - Design System

## Overview
This design system provides comprehensive styling and component standards for a professional ERP system demo targeting a Taiwanese market with Traditional Chinese (Big5) support.

## 1. Global Navigation Structure

### Main Navigation Menu Items
- 🏠 首頁 (Dashboard) - `index.html`
- 🛒 訂單管理 (Order Management) - `orders.html`
- 📈 報表管理 (Reports) - `reports.html`
- 📦 庫存管理 (Inventory) - `inventory.html`
- 💰 財務管理 (Accounting) - `accounting.html`
- ⚙️ 系統設定 (Settings) - `settings.html`
- 🚪 登出 (Logout) - Returns to `login.html`

### Navigation Behavior
- Desktop-first design with fixed top navigation
- Active page highlighted with primary color
- Hover effects with subtle background changes
- Mobile responsiveness not required (desktop-only)

## 2. Global CSS Variables & Styling

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-light: #dbeafe;
  
  /* Secondary Colors */
  --secondary-color: #64748b;
  --secondary-light: #f1f5f9;
  
  /* Status Colors */
  --success-color: #059669;
  --warning-color: #d97706;
  --danger-color: #dc2626;
  --info-color: #0891b2;
  
  /* Neutral Colors */
  --background-color: #f8fafc;
  --surface-color: #ffffff;
  --border-color: #e2e8f0;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Typography
```css
/* Font Stack with Traditional Chinese Support */
--font-family: 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', 'Source Han Sans TC', system-ui, -apple-system, sans-serif;

/* Font Sizes */
--font-xs: 0.75rem;    /* 12px */
--font-sm: 0.875rem;   /* 14px */
--font-base: 1rem;     /* 16px */
--font-lg: 1.125rem;   /* 18px */
--font-xl: 1.25rem;    /* 20px */
--font-2xl: 1.5rem;    /* 24px */
--font-3xl: 1.875rem;  /* 30px */
--font-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing Standards
```css
/* Spacing Scale */
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
```

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  padding: var(--space-3) var(--space-6);
  border: none;
  border-radius: 0.375rem;
  font-weight: var(--font-medium);
  font-size: var(--font-sm);
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
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: var(--space-3) var(--space-6);
  border-radius: 0.375rem;
  font-weight: var(--font-medium);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* Danger Button */
.btn-danger {
  background-color: var(--danger-color);
  color: white;
  padding: var(--space-3) var(--space-6);
  border: none;
  border-radius: 0.375rem;
  font-weight: var(--font-medium);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}
```

### Card Component Styling
```css
.card {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
}

.card-title {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}
```

### Form Input Styling
```css
.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.form-input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: var(--font-sm);
  font-family: var(--font-family);
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-select {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: var(--font-sm);
  font-family: var(--font-family);
  background-color: var(--surface-color);
  cursor: pointer;
}
```

## 3. Component Templates

### Navigation Template
```html
<nav class="navbar">
  <div class="navbar-brand">
    <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzI1NjNlYiIvPgo8cGF0aCBkPSJNOCAxMmgxNnY4SDh6IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K" alt="ERP Logo" class="navbar-logo">
    <span class="navbar-title">企業資源規劃系統</span>
  </div>
  <ul class="navbar-menu">
    <li><a href="index.html" class="nav-link">🏠 首頁</a></li>
    <li><a href="orders.html" class="nav-link">🛒 訂單管理</a></li>
    <li><a href="reports.html" class="nav-link">📈 報表管理</a></li>
    <li><a href="inventory.html" class="nav-link">📦 庫存管理</a></li>
    <li><a href="accounting.html" class="nav-link">💰 財務管理</a></li>
    <li><a href="settings.html" class="nav-link">⚙️ 系統設定</a></li>
  </ul>
  <div class="navbar-user">
    <span class="user-name">管理員</span>
    <button class="btn-logout" onclick="logout()">🚪 登出</button>
  </div>
</nav>
```

### Card Component Template
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">[Card Title]</h3>
  </div>
  <div class="card-content">
    [Card Content]
  </div>
</div>
```

### Form Template
```html
<form class="form">
  <div class="form-group">
    <label class="form-label">[Label Text]</label>
    <input type="text" class="form-input" placeholder="[Placeholder]">
  </div>
  <div class="form-actions">
    <button type="submit" class="btn-primary">[Primary Action]</button>
    <button type="button" class="btn-secondary">[Secondary Action]</button>
  </div>
</form>
```

### Data Table Template
```html
<div class="table-container">
  <table class="data-table">
    <thead>
      <tr>
        <th>[Column 1]</th>
        <th>[Column 2]</th>
        <th>[Column 3]</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>[Data 1]</td>
        <td>[Data 2]</td>
        <td>[Data 3]</td>
        <td class="table-actions">
          <button class="btn-sm btn-primary">編輯</button>
          <button class="btn-sm btn-danger">刪除</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

## 4. Page Layout Standards

### Basic Page Structure
```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Page Title] - 企業資源規劃系統</title>
  <style>
    /* CSS Variables and Global Styles */
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar">...</nav>
  
  <!-- Main Content -->
  <main class="main-content">
    <div class="page-header">
      <h1 class="page-title">[Page Title]</h1>
      <div class="page-actions">
        [Action Buttons]
      </div>
    </div>
    
    <div class="page-content">
      [Page Content]
    </div>
  </main>
  
  <!-- Footer -->
  <footer class="footer">
    <p>&copy; 2024 企業資源規劃系統. All rights reserved.</p>
  </footer>
  
  <script>
    /* JavaScript */
  </script>
</body>
</html>
```

### Layout CSS
```css
body {
  font-family: var(--font-family);
  background-color: var(--background-color);
  color: var(--text-primary);
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  padding: var(--space-4) var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.main-content {
  flex: 1;
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-color);
}

.page-title {
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.footer {
  background-color: var(--surface-color);
  border-top: 1px solid var(--border-color);
  padding: var(--space-4);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-sm);
}
```

## 5. Responsive Breakpoints (Desktop-Only)

Since this is a desktop-only application, we focus on optimal display at:
- **Primary Target**: 1920x1080 (Full HD)
- **Secondary Target**: 1366x768 (HD)
- **Minimum Support**: 1024x768

## 6. Big5 Encoding & Traditional Chinese Guidelines

### Character Encoding
- Always use UTF-8 meta tag: `<meta charset="UTF-8">`
- Language attribute: `<html lang="zh-TW">`
- Font stack prioritizes Traditional Chinese fonts

### Text Content Standards
- Use Traditional Chinese characters throughout
- Maintain consistent terminology across modules
- Ensure proper line-height for Chinese text (1.6 minimum)
- Use appropriate punctuation marks (，。；：)

## 7. Interactive Elements Guidelines

### Loading States
```css
.loading {
  opacity: 0.6;
  pointer-events: none;
  position: relative;
}

.loading::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Success/Error Messages
```css
.alert {
  padding: var(--space-4);
  border-radius: 0.375rem;
  margin-bottom: var(--space-4);
  border: 1px solid;
}

.alert-success {
  background-color: #f0fdf4;
  border-color: #22c55e;
  color: #15803d;
}

.alert-error {
  background-color: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
}

.alert-warning {
  background-color: #fffbeb;
  border-color: #f59e0b;
  color: #d97706;
}
```

This design system ensures consistent, professional appearance across all ERP modules while maintaining Traditional Chinese cultural and linguistic requirements.