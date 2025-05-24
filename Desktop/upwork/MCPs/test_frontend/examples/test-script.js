// Example test script showing how to use the Puppeteer MCP server
// This demonstrates testing the example login form

async function runLoginTest() {
    // Step 1: Launch the browser
    console.log('Launching browser...');
    await callTool('launch_browser', { headless: false });
    
    // Step 2: Navigate to the test page
    console.log('Navigating to test page...');
    // Note: Update this path to your actual file location
    await callTool('navigate', { 
        url: 'file:///Users/Mike/.claude/local/examples/test-example.html' 
    });
    
    // Step 3: Test invalid login
    console.log('Testing invalid login...');
    await callTool('type', { selector: '#username', text: 'wronguser' });
    await callTool('type', { selector: '#password', text: 'wrongpass' });
    await callTool('click', { selector: '#submit-btn' });
    
    // Wait for error message
    await callTool('wait_for_selector', { selector: '#error-msg[style*="display: block"]' });
    const errorText = await callTool('get_text', { selector: '#error-msg' });
    console.log('Error message:', errorText);
    
    // Step 4: Clear form and test valid login
    console.log('Testing valid login...');
    await callTool('evaluate', { 
        script: `
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        `
    });
    
    await callTool('type', { selector: '#username', text: 'testuser' });
    await callTool('type', { selector: '#password', text: 'testpass' });
    await callTool('click', { selector: '#submit-btn' });
    
    // Wait for success message
    await callTool('wait_for_selector', { selector: '#success-msg[style*="display: block"]' });
    const successText = await callTool('get_text', { selector: '#success-msg' });
    console.log('Success message:', successText);
    
    // Step 5: Take screenshot
    console.log('Taking screenshot...');
    await callTool('screenshot', { 
        path: 'test-success.png',
        fullPage: true 
    });
    
    // Step 6: Close browser
    console.log('Closing browser...');
    await callTool('close_browser', {});
    
    console.log('Test completed successfully!');
}

// Helper function to simulate MCP tool calls
async function callTool(toolName, args) {
    console.log(`Calling tool: ${toolName}`, args);
    // In actual usage, this would be handled by the MCP client
    // This is just for demonstration purposes
}

// Run the test
runLoginTest().catch(console.error);