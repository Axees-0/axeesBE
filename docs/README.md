# Axees Platform - Workflow Documentation

This directory contains comprehensive workflow diagrams for the Axees influencer marketing platform.

## 📁 Directory Structure

```
docs/
├── mermaid/              # Mermaid source files (.mmd)
├── svgs/                 # Generated SVG diagrams (.svg)
├── README.md             # This file
├── generate_svgs.sh      # SVG generation script
└── AXEES_WORKFLOW_DIAGRAMS.md  # Complete analysis document
```

## 📊 Available Diagrams

Each diagram is available in both Mermaid source format (in `/mermaid/`) and generated SVG format (in `/svgs/`):

| # | Diagram Name | Mermaid Source | SVG Output |
|---|--------------|----------------|------------|
| 1 | System Architecture | [mermaid/01_system_architecture.mmd](mermaid/01_system_architecture.mmd) | [svgs/01_system_architecture.svg](svgs/01_system_architecture.svg) |
| 2 | User Registration Flow | [mermaid/02_user_registration_flow.mmd](mermaid/02_user_registration_flow.mmd) | [svgs/02_user_registration_flow.svg](svgs/02_user_registration_flow.svg) |
| 3 | Offer-to-Deal Workflow | [mermaid/03_offer_to_deal_workflow.mmd](mermaid/03_offer_to_deal_workflow.mmd) | [svgs/03_offer_to_deal_workflow.svg](svgs/03_offer_to_deal_workflow.svg) |
| 4 | Deal Execution & Milestones | [mermaid/04_deal_execution_milestones.mmd](mermaid/04_deal_execution_milestones.mmd) | [svgs/04_deal_execution_milestones.svg](svgs/04_deal_execution_milestones.svg) |
| 5 | Payment & Escrow System | [mermaid/05_payment_escrow_system.mmd](mermaid/05_payment_escrow_system.mmd) | [svgs/05_payment_escrow_system.svg](svgs/05_payment_escrow_system.svg) |
| 6 | Real-time Chat Communication | [mermaid/06_realtime_chat_communication.mmd](mermaid/06_realtime_chat_communication.mmd) | [svgs/06_realtime_chat_communication.svg](svgs/06_realtime_chat_communication.svg) |
| 7 | AI Creator Discovery | [mermaid/07_ai_creator_discovery.mmd](mermaid/07_ai_creator_discovery.mmd) | [svgs/07_ai_creator_discovery.svg](svgs/07_ai_creator_discovery.svg) |
| 8 | API Endpoint Mapping | [mermaid/08_api_endpoint_mapping.mmd](mermaid/08_api_endpoint_mapping.mmd) | [svgs/08_api_endpoint_mapping.svg](svgs/08_api_endpoint_mapping.svg) |
| 9 | Data Model Relationships | [mermaid/09_data_model_relationships.mmd](mermaid/09_data_model_relationships.mmd) | [svgs/09_data_model_relationships.svg](svgs/09_data_model_relationships.svg) |
| 10 | Error Handling & Status Flow | [mermaid/10_error_handling_status_flow.mmd](mermaid/10_error_handling_status_flow.mmd) | [svgs/10_error_handling_status_flow.svg](svgs/10_error_handling_status_flow.svg) |

### Frontend User Interface Diagrams

| # | Diagram Name | Mermaid Source | SVG Output |
|---|--------------|----------------|------------|
| 11 | Frontend Overall Navigation | [mermaid/11_frontend_overall_navigation.mmd](mermaid/11_frontend_overall_navigation.mmd) | [svgs/11_frontend_overall_navigation.svg](svgs/11_frontend_overall_navigation.svg) |
| 12 | Frontend Authentication Flow | [mermaid/12_frontend_authentication_flow.mmd](mermaid/12_frontend_authentication_flow.mmd) | [svgs/12_frontend_authentication_flow.svg](svgs/12_frontend_authentication_flow.svg) |
| 13 | Frontend Marketer Offer Flow | [mermaid/13_frontend_marketer_offer_flow.mmd](mermaid/13_frontend_marketer_offer_flow.mmd) | [svgs/13_frontend_marketer_offer_flow.svg](svgs/13_frontend_marketer_offer_flow.svg) |
| 14 | Frontend Creator Deal Flow | [mermaid/14_frontend_creator_deal_flow.mmd](mermaid/14_frontend_creator_deal_flow.mmd) | [svgs/14_frontend_creator_deal_flow.svg](svgs/14_frontend_creator_deal_flow.svg) |
| 15 | Frontend Screen Hierarchy | [mermaid/15_frontend_screen_hierarchy.mmd](mermaid/15_frontend_screen_hierarchy.mmd) | [svgs/15_frontend_screen_hierarchy.svg](svgs/15_frontend_screen_hierarchy.svg) |
| 16 | Frontend User Journey Comparison | [mermaid/16_frontend_user_journey_comparison.mmd](mermaid/16_frontend_user_journey_comparison.mmd) | [svgs/16_frontend_user_journey_comparison.svg](svgs/16_frontend_user_journey_comparison.svg) |
| 17 | Frontend Responsive Design | [mermaid/17_frontend_responsive_design_breakpoints.mmd](mermaid/17_frontend_responsive_design_breakpoints.mmd) | [svgs/17_frontend_responsive_design_breakpoints.svg](svgs/17_frontend_responsive_design_breakpoints.svg) |
| 18 | Frontend Component Architecture | [mermaid/18_frontend_component_architecture.mmd](mermaid/18_frontend_component_architecture.mmd) | [svgs/18_frontend_component_architecture.svg](svgs/18_frontend_component_architecture.svg) |

## 🎯 Quick Reference Guide

### For Business Stakeholders:
1. **System Architecture** - High-level overview of platform components
2. **Offer-to-Deal Workflow** - Complete business process from creator discovery to deal completion
3. **Payment & Escrow System** - How money flows through the platform

### For Technical Teams:
1. **API Endpoint Mapping** - Complete API structure with 110+ endpoints
2. **Data Model Relationships** - Database schema and entity relationships
3. **User Registration Flow** - Authentication and onboarding sequence

### For Product Managers:
1. **Deal Execution & Milestones** - Project management and milestone tracking
2. **AI Creator Discovery** - How AI-powered creator matching works
3. **Real-time Chat Communication** - Messaging system architecture

### For QA/Testing:
1. **Error Handling & Status Flow** - Request processing and error states
2. **User Registration Flow** - Multi-step verification process
3. **Deal Execution & Milestones** - State transitions and status tracking

### For Frontend/UI Developers:
1. **Frontend Overall Navigation** - Complete app navigation structure
2. **Frontend Screen Hierarchy** - All screens and components organized
3. **Frontend Component Architecture** - React Native component structure
4. **Frontend Responsive Design** - Breakpoints and device adaptations

### For UX/UI Designers:
1. **Frontend User Journey Comparison** - Creator vs Marketer user flows
2. **Frontend Authentication Flow** - Complete login/registration experience
3. **Frontend Marketer Offer Flow** - Marketer's offer creation journey
4. **Frontend Creator Deal Flow** - Creator's deal management experience

## 🔧 Regenerating Diagrams

### Using the Generation Script:
```bash
# Run the automated script
./generate_svgs.sh
```

### Manual Generation:
```bash
# Single diagram
mmdc -i mermaid/01_system_architecture.mmd -o svgs/01_system_architecture.svg

# All diagrams
for file in mermaid/*.mmd; do
    filename=$(basename "$file" .mmd)
    mmdc -i "$file" -o "svgs/${filename}.svg"
done
```

## 📂 File Organization

### `/mermaid/` Directory
Contains all Mermaid source files (`.mmd`) for editing and version control:
- Easy to modify and maintain
- Version control friendly (text files)
- Can be edited in any text editor or Mermaid-compatible tools

### `/svgs/` Directory
Contains generated SVG files for presentations and documentation:
- High-quality vector graphics
- Scalable for any presentation size
- Compatible with web browsers, presentations, and documentation

## 📊 Platform Overview

The Axees platform is a comprehensive influencer marketing platform featuring:

- **110+ API Endpoints** across 11 major modules
- **Multi-step user onboarding** with OTP verification
- **AI-powered creator discovery** using OpenAI and web scraping
- **Complex offer negotiation** system with counter-offers
- **Milestone-based project management** with escrow payments
- **Real-time messaging** with Server-Sent Events
- **Stripe integration** for payment processing
- **Content approval workflows** for deliverables

## 🔗 Related Documentation

- [Complete Workflow Analysis](AXEES_WORKFLOW_DIAGRAMS.md) - Detailed analysis document
- [Source Code](../) - Backend implementation files
- [Mermaid Documentation](https://mermaid.js.org/) - Official Mermaid syntax guide

## 💡 Usage Tips

### For Presentations:
- Use SVG files from `/svgs/` directory
- SVGs scale perfectly for any screen size
- Can be embedded in presentations, websites, or documentation

### For Editing:
- Modify `.mmd` files in `/mermaid/` directory
- Use [Mermaid Live Editor](https://mermaid.live/) for visual editing
- Regenerate SVGs after making changes

### For Development:
- Reference the comprehensive analysis in `AXEES_WORKFLOW_DIAGRAMS.md`
- Use API endpoint mapping for integration planning
- Follow data model relationships for database design

---

*Generated from comprehensive analysis of 61 backend files including controllers, models, routes, and utilities.*