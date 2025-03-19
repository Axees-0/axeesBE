# SoloTrend X Development Guidelines

This project follows the Universal Directory Structure as outlined in the `/docs/architecture/universal_directory.md` file. The directory structure is designed to provide a consistent and scalable organization for the project.

## Key Reference Files

These documents must be referenced with every step of development:

- **Architecture Diagram**: `/docs/architecture/architecture_diagram.md`
- **Universal Directory Structure**: `/docs/architecture/universal_directory.md`
- **Development Steps**: `/docs/user-guides/DEV_STEPS.md`
- **README.md**: Project overview and basic documentation

## Development Philosophy

The project follows these key principles:

1. **Mac-First Development**: Develop and test as much as possible on macOS using mocks
2. **Test-Driven Development**: Create tests before implementing features
3. **Modular Architecture**: Build independent components that connect through well-defined interfaces
4. **Windows-Last Integration**: Only integrate with the live Windows MT4 API at the final stage

## Project Organization

The project is organized into these key areas:

1. **Source Code** (`/src/`): All application code (frontend and backend)
2. **Tests** (`/tests/`): Unit, integration, and e2e tests
3. **Documentation** (`/docs/`): Architecture diagrams and user guides
4. **Configuration** (`/config/`): Environmental and application configuration
5. **Data** (`/data/`): Input/output data and logs

## Development Workflow

When working on this project, please:

1. Follow the step-by-step guide in `DEV_STEPS.md`
2. Create unit and integration tests for each component
3. Use mock implementations for Windows-only components
4. Verify all components work together before Azure deployment
5. Keep code in the appropriate directories according to universal_directory.md

## Development Phases

1. **Phase 1**: Mock MT4 API and local development environment setup
2. **Phase 2**: Component implementation (Webhook API, Telegram Bot, Signal Processing)
3. **Phase 3**: Integration testing with mock components
4. **Phase 4**: Windows VM deployment and live MT4 integration

## Common Commands

```bash
# Run unit tests
pytest tests/unit

# Run integration tests
pytest tests/integration

# Run the mock development environment
./start_dev_environment.sh
```

## References

- Universal Directory Structure: `/docs/architecture/universal_directory.md`
- Architecture Diagram: `/docs/architecture/architecture_diagram.md`
- Development Steps: `/docs/user-guides/DEV_STEPS.md`