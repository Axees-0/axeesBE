# Puppeteer MCP Server

An MCP (Model Context Protocol) server that provides Puppeteer-based browser automation tools for frontend testing.

## Installation

```bash
npm install
```

## Usage

### Starting the Server

```bash
npm start
```

### Available Tools

1. **launch_browser** - Launch a new browser instance
   - `headless` (boolean): Run browser in headless mode (default: true)

2. **navigate** - Navigate to a URL
   - `url` (string): The URL to navigate to
   - `waitUntil` (string): When to consider navigation succeeded (default: 'networkidle2')

3. **click** - Click an element
   - `selector` (string): CSS selector for the element to click
   - `waitForSelector` (boolean): Wait for element to appear before clicking (default: true)

4. **type** - Type text into an input field
   - `selector` (string): CSS selector for the input field
   - `text` (string): Text to type
   - `delay` (number): Delay between key presses in milliseconds (default: 0)

5. **screenshot** - Take a screenshot of the current page
   - `path` (string): Path to save the screenshot
   - `fullPage` (boolean): Capture full page screenshot (default: false)

6. **get_text** - Get text content of an element
   - `selector` (string): CSS selector for the element

7. **wait_for_selector** - Wait for an element to appear
   - `selector` (string): CSS selector to wait for
   - `timeout` (number): Maximum time to wait in milliseconds (default: 30000)

8. **evaluate** - Execute JavaScript in the page context
   - `script` (string): JavaScript code to execute

9. **close_browser** - Close the browser instance

### Example Test Workflow

```javascript
// 1. Launch browser
await launch_browser({ headless: false });

// 2. Navigate to website
await navigate({ url: 'https://example.com' });

// 3. Fill in a form
await type({ selector: '#username', text: 'testuser' });
await type({ selector: '#password', text: 'testpass' });

// 4. Click submit button
await click({ selector: '#submit-btn' });

// 5. Wait for result
await wait_for_selector({ selector: '.success-message' });

// 6. Get result text
const result = await get_text({ selector: '.success-message' });

// 7. Take screenshot
await screenshot({ path: 'test-result.png' });

// 8. Close browser
await close_browser();
```

### Integration with Claude

To use this MCP server with Claude, add it to your Claude configuration:

```json
{
  "mcpServers": {
    "puppeteer-test": {
      "command": "node",
      "args": ["/path/to/this/project/dist/index.js"]
    }
  }
}
```

## Development

```bash
# Run in watch mode
npm run dev

# Build TypeScript
npm run build
```