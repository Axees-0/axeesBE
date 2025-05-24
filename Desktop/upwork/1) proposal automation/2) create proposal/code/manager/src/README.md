# Claude Task Manager Source Code

This directory contains the source code for the Claude Task Manager application. The code is organized by component/layer.

## Code Organization

- **core/**: Core task management functionality and domain models
  - **interfaces/**: Interface definitions
  - **models/**: Domain models
  
- **web/**: Web dashboard and UI components
  - **routes/**: API and UI routes
  - **static/**: Static assets (CSS, JS, images)
  - **templates/**: HTML templates
  
- **cli/**: Command-line interface
  - **commands/**: Command implementations
  
- **infrastructure/**: Infrastructure services
  - **monitoring/**: Monitoring services
  - **persistence/**: Data persistence
  - **process/**: Process management (tmux, terminal)
  - **service/**: Service scripts
  
- **monitoring/**: Monitoring utilities and services
  
- **utils/**: Utility functions
  
- **runners/**: Entry point scripts
  
- **debug/**: Debug utilities

## Main Entry Points

- **__main__.py**: Main application entry point
- **web/dashboard.py**: Web dashboard
- **monitoring/**: Monitoring tools
- **cli/**: Command-line tools

## Architecture

The application follows a layered architecture:

1. **Presentation Layer**: UI components (web/, cli/)
2. **Application Layer**: Core business logic (core/)
3. **Infrastructure Layer**: Technical services (infrastructure/)
4. **Utility Layer**: Helper utilities (utils/)

## Dependencies

The main dependencies between modules are:

- Web and CLI depend on Core
- Core depends on Infrastructure
- Infrastructure depends on Utils
- Monitoring depends on Infrastructure
