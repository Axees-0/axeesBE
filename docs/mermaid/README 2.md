# Mermaid Source Files

This directory contains all Mermaid diagram source files (`.mmd`) for the Axees platform workflow documentation.

## Files

1. `01_system_architecture.mmd` - Overall platform architecture
2. `02_user_registration_flow.mmd` - User onboarding sequence diagram
3. `03_offer_to_deal_workflow.mmd` - Complete business workflow flowchart
4. `04_deal_execution_milestones.mmd` - Deal state management diagram
5. `05_payment_escrow_system.mmd` - Payment processing sequence
6. `06_realtime_chat_communication.mmd` - Messaging system sequence
7. `07_ai_creator_discovery.mmd` - AI-powered creator matching flowchart
8. `08_api_endpoint_mapping.mmd` - Complete API structure mindmap
9. `09_data_model_relationships.mmd` - Database schema ER diagram
10. `10_error_handling_status_flow.mmd` - Error processing flowchart

## Usage

### Editing
- These files can be edited in any text editor
- Use [Mermaid Live Editor](https://mermaid.live/) for visual editing
- Follow [Mermaid syntax documentation](https://mermaid.js.org/)

### Generating SVGs
```bash
# From the docs directory
./generate_svgs.sh

# Or manually for a single file
mmdc -i mermaid/01_system_architecture.mmd -o svgs/01_system_architecture.svg
```

## Mermaid Syntax Quick Reference

- **Flowcharts**: `flowchart TD` or `graph TB`
- **Sequence Diagrams**: `sequenceDiagram`
- **State Diagrams**: `stateDiagram-v2`
- **ER Diagrams**: `erDiagram`
- **Mind Maps**: `mindmap`

See the [official documentation](https://mermaid.js.org/) for complete syntax guide.