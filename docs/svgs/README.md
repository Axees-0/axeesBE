# SVG Diagram Files

This directory contains all generated SVG diagram files for the Axees platform workflow documentation.

## Files

1. `01_system_architecture.svg` - Overall platform architecture (25KB)
2. `02_user_registration_flow.svg` - User onboarding sequence (29KB)
3. `03_offer_to_deal_workflow.svg` - Complete business workflow (53KB)
4. `04_deal_execution_milestones.svg` - Deal state management (51KB)
5. `05_payment_escrow_system.svg` - Payment processing sequence (32KB)
6. `06_realtime_chat_communication.svg` - Messaging system sequence (33KB)
7. `07_ai_creator_discovery.svg` - AI-powered creator matching (32KB)
8. `08_api_endpoint_mapping.svg` - Complete API structure mindmap (95KB)
9. `09_data_model_relationships.svg` - Database schema ER diagram (211KB)
10. `10_error_handling_status_flow.svg` - Error processing flowchart (28KB)

## Usage

### For Presentations
- These SVG files are perfect for presentations, documentation, and web use
- They scale to any size without quality loss
- Compatible with browsers, PowerPoint, Google Slides, etc.

### File Sizes
- **Small** (25-35KB): Architecture, sequences, error flows
- **Medium** (50-55KB): Complex workflows and state diagrams  
- **Large** (95-211KB): Detailed mind maps and ER diagrams

### Opening SVG Files
- **Web Browsers**: Drag and drop into any browser
- **Vector Graphics Software**: Adobe Illustrator, Inkscape, etc.
- **Presentations**: Insert as images in PowerPoint, Google Slides
- **Documentation**: Embed in Markdown, HTML, or documentation tools

## Regenerating

These files are automatically generated from the Mermaid source files in `/mermaid/`. 

To regenerate:
```bash
# From the docs directory
./generate_svgs.sh
```

## Quality Notes

- All diagrams are generated at high resolution
- Vector format ensures crisp display at any size
- Optimized for both screen display and printing
- Color schemes designed for professional presentations