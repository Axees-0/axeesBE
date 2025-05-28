# AI Workflow Generation Prompt

## Objective
Generate a comprehensive navigation.yaml workflow file for frontend testing automation based on a target directory/website analysis.

## Context
You are creating test workflows for a Puppeteer-based MCP server that automates browser interactions and captures screenshots. The workflow will be executed by the test_frontend_navigate application.

## Input
- **Target Directory/Website**: [DIRECTORY_PATH or URL]
- **Testing Goals**: [Specify what needs to be tested - navigation, forms, interactions, etc.]

## Output Format
Generate a YAML file named `navigation.yaml` with the following structure:

```yaml
name: "[Descriptive Test Name]"
description: "[What this workflow tests]"
version: "1.0.0"

config:
  headless: true
  timeout: 15000
  viewport:
    width: 1280
    height: 720

steps:
  # Your generated steps here
```

## Available Step Types

### Navigation & Page Control
- `navigate` - Go to URL
- `wait` - Wait for specified time
- `wait-for-selector` - Wait for element to appear
- `screenshot` - Capture screenshot

### Interactions  
- `click` - Click element
- `type` - Type text into input
- `evaluate` - Execute JavaScript

### Assertions
- `assertText` - Verify text content
- `assert-text` - Alternative assertion format

## Step Properties
Each step can include:
- `description` - Human readable description
- `selector` - CSS selector for element targeting
- `screenshot: true` - Capture screenshot after this step
- `timeout` - Override default timeout
- `waitBefore` - Wait before executing (ms)
- `waitAfter` - Wait after executing (ms)
- `retryCount` - Number of retry attempts

## Generation Guidelines

1. **Start with navigation**: Always begin with a `navigate` step to the main page
2. **Add strategic screenshots**: Include `screenshot: true` for key interactions and page states
3. **Test critical paths**: Focus on main user journeys and important functionality
4. **Include assertions**: Verify expected content exists using `assertText`
5. **Handle timing**: Add appropriate waits for dynamic content
6. **Progressive complexity**: Start simple, build up to complex interactions

## Example Patterns

### Basic Page Navigation
```yaml
- type: navigate
  description: "Navigate to homepage"
  url: "https://example.com"
  screenshot: true

- type: wait-for-selector
  description: "Wait for main content"
  selector: "main, .content, #main"
  
- type: assertText
  description: "Verify page loaded"
  selector: "h1"
  expected: "Expected Title"
```

### Form Interaction
```yaml
- type: click
  description: "Click login button"
  selector: "#login-btn"
  screenshot: true
  
- type: type
  description: "Enter username"
  selector: "#username"
  value: "testuser"
  
- type: type
  description: "Enter password"
  selector: "#password"
  value: "testpass"
  
- type: click
  description: "Submit form"
  selector: "#submit"
  screenshot: true
```

### Content Verification
```yaml
- type: evaluate
  description: "Get page metrics"
  script: |
    {
      title: document.title,
      url: window.location.href,
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      elementCount: document.querySelectorAll('*').length
    }
```

## Analysis Instructions

When given a directory or website:

1. **Identify key pages**: Map out main sections, landing pages, forms
2. **Determine user flows**: Login, registration, checkout, navigation paths
3. **Find interactive elements**: Buttons, forms, dropdowns, modals
4. **Locate content to verify**: Headers, key text, success messages
5. **Consider edge cases**: Error states, loading states, responsive behavior

## Output Requirements

- Generate a complete, executable YAML workflow
- Include 8-15 meaningful test steps
- Add screenshots at key interaction points (every 2-3 steps)
- Include at least 2 assertions to verify functionality
- Provide clear, descriptive step descriptions
- Use realistic selectors based on common HTML patterns
- Add appropriate waits for dynamic content

## Error Handling
- Include retry logic for flaky elements
- Add fallback selectors when possible
- Use timeouts appropriate for the interaction type

Generate the navigation.yaml file now based on the provided target directory/website.