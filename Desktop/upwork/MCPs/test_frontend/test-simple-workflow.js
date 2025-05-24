#!/usr/bin/env node
/**
 * Simple test for workflow execution
 */

const { spawn } = require('child_process');
const path = require('path');

async function testSimpleWorkflow() {
  console.log('🚀 Testing simple workflow execution...\n');
  
  // Simple workflow that navigates to example.com
  const simpleWorkflow = {
    name: "Simple Test",
    description: "Navigate to example.com and verify",
    steps: [
      {
        type: "navigate",
        url: "https://example.com",
        description: "Go to example.com",
        screenshot: true
      },
      {
        type: "wait",
        value: 2000,
        description: "Wait for page to load"
      },
      {
        type: "assertText",
        selector: "h1",
        expected: "Example Domain",
        description: "Verify page title"
      }
    ]
  };
  
  // Start the MCP server
  console.log('Starting MCP server...');
  const serverProcess = spawn('node', [path.join(__dirname, 'dist', 'index.js')], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let serverReady = false;
  let requestSent = false;
  
  // Capture all server output
  serverProcess.stdout.on('data', (data) => {
    // console.log('STDOUT:', data.toString());
  });
  
  serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    // console.log('STDERR:', output);
    
    if (output.includes('Puppeteer MCP server running on stdio') && !requestSent) {
      serverReady = true;
      requestSent = true;
      console.log('✅ Server ready\n');
      
      // Send test request
      setTimeout(() => {
        console.log('Sending workflow execution request...');
        
        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'execute_workflow',
            arguments: {
              workflow: JSON.stringify(simpleWorkflow),
              reportFormat: 'markdown'
            }
          }
        };
        
        serverProcess.stdin.write(JSON.stringify(request) + '\n');
        
        // Set up response handler
        let responseBuffer = '';
        
        const handleResponse = (data) => {
          responseBuffer += data.toString();
          
          const lines = responseBuffer.split('\n');
          responseBuffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const response = JSON.parse(line);
                if (response.id === 1) {
                  console.log('\n✅ Got response!\n');
                  
                  if (response.result && response.result.content) {
                    console.log('=== Workflow Report ===\n');
                    console.log(response.result.content[0].text);
                  } else if (response.error) {
                    console.error('❌ Error:', response.error);
                  }
                  
                  // Cleanup
                  setTimeout(() => {
                    serverProcess.kill();
                    process.exit(0);
                  }, 1000);
                }
              } catch (e) {
                // Not valid JSON yet
              }
            }
          }
        };
        
        serverProcess.stdout.on('data', handleResponse);
      }, 1000);
    }
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });
  
  // Timeout
  setTimeout(() => {
    console.error('❌ Test timeout');
    serverProcess.kill();
    process.exit(1);
  }, 30000);
}

// Run test
testSimpleWorkflow().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});