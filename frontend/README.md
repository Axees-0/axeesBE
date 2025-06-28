# Axees Frontend

React Native/Expo application for the Axees influencer marketing platform.

## Project Structure

```
frontend/
├── 📁 app/                      # Main application screens and routing
│   ├── (tabs)/                  # Tab-based navigation screens
│   ├── campaigns/               # Campaign management screens
│   ├── deals/                   # Deal management screens
│   ├── offers/                  # Offer management screens
│   └── ...                      # Other app screens
├── 📁 components/               # Reusable UI components
│   ├── mobile/                  # Mobile-specific components
│   ├── web/                     # Web-specific components
│   └── ...                      # Shared components
├── 📁 assets/                   # Static assets (images, fonts, icons)
├── 📁 constants/                # App constants and configuration
├── 📁 contexts/                 # React Context providers
├── 📁 hooks/                    # Custom React hooks
├── 📁 utils/                    # Utility functions and helpers
├── 📁 styles/                   # Design system and styling
├── 📁 services/                 # API and external services
├── 📁 demo/                     # Demo data and configurations
├── 📁 crawler/                  # Testing and automation tools
├── 📁 web-shims/                # Web platform compatibility shims
├── 📁 public/                   # Public web assets
├── 📁 docs/                     # 📚 Documentation and guides
│   ├── deployment/              # Deployment documentation
│   └── stages/                  # Development stage documentation
├── 📁 scripts/                  # 🔧 Build and maintenance scripts
│   ├── deployment/              # Deployment scripts
│   ├── maintenance/             # Maintenance and cleanup scripts
│   ├── test/                    # Test automation scripts
│   └── debug/                   # Debug and development tools
├── 📁 tests/                    # Test files and reports
├── 📁 testing-archive/          # Archived testing files
├── 📁 archive/                  # 📦 Archived files and backups
│   ├── *.zip                    # Build archives
│   ├── *.tar.gz                 # Deployment packages
│   └── deployment-*.json        # Historical deployment status
├── 📁 dist/                     # Build output directory
├── 📁 dist-new/                 # Latest build output
├── 📁 node_modules/             # NPM dependencies
└── 📄 Configuration Files       # Root-level config files
    ├── package.json             # NPM package configuration
    ├── tsconfig.json            # TypeScript configuration
    ├── babel.config.js          # Babel configuration
    ├── metro.config.js          # Metro bundler configuration
    ├── webpack.config.js        # Webpack configuration
    ├── netlify.toml             # Netlify deployment configuration
    ├── app.config.js            # Expo application configuration
    ├── sentry.config.js         # Error monitoring configuration
    ├── .env.*                   # Environment variables
    └── ...                      # Other config files
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Deploy to Netlify
npm run deploy
```

## Development

- **Platform**: React Native with Expo
- **Web Support**: React Native Web
- **Styling**: StyleSheet API with design system
- **State Management**: React Context + TanStack Query
- **Navigation**: Expo Router
- **Build System**: Metro (mobile) + Webpack (web)

## Documentation

- 📖 **Main Documentation**: [docs/README.md](docs/README.md)
- 🚀 **Deployment Guide**: [docs/deployment/](docs/deployment/)
- 🧪 **Testing**: [tests/](tests/)
- 🔧 **Scripts**: [scripts/](scripts/)

## File Organization

This project follows a clean, organized structure:

- **Root Level**: Only essential configuration files
- **Source Code**: Organized in logical directories (`app/`, `components/`, etc.)
- **Documentation**: Centralized in `docs/` directory
- **Scripts**: Organized by purpose in `scripts/` subdirectories
- **Archives**: Historical files moved to `archive/` directory

## Contributing

1. Keep the root directory clean - only essential config files
2. Place documentation in the `docs/` directory
3. Use appropriate subdirectories for scripts and utilities
4. Follow the established naming conventions

## Support

For issues and support, see the troubleshooting guide in `docs/troubleshooting-runbook.md`.