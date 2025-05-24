#!/usr/bin/env node
/**
 * Test workflow validation
 */

const { spawn } = require('child_process');
const path = require('path');

async function testValidation() {
  console.log('🚀 Testing workflow validation...\n');
  
  const serverProcess = spawn('node', [path.join(__dirname, 'dist', 'index.js')], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let requestSent = false;
  
  serverProcess.stderr.on('data', (data) => {
    if (data.toString().includes('Puppeteer MCP server running') && !requestSent) {
      requestSent = true;
      console.log('✅ Server ready\n');
      
      // Test 1: Valid workflow
      console.log('Test 1: Valid workflow');
      const validWorkflow = {
        name: "Valid Test",
        steps: [
          { type: "navigate", url: "https://example.com" },
          { type: "click", selector: "#button" }
        ]
      };
      
      sendRequest(1, 'validate_workflow', { 
        workflow: JSON.stringify(validWorkflow) 
      });
      
      // Test 2: Invalid workflow (missing required fields)
      setTimeout(() => {
        console.log('\nTest 2: Invalid workflow (missing name)');
        const invalidWorkflow = {
          steps: [{ type: "navigate", url: "https://example.com" }]
        };
        
        sendRequest(2, 'validate_workflow', { 
          workflow: JSON.stringify(invalidWorkflow) 
        });
      }, 1000);
      
      // Test 3: Invalid step type
      setTimeout(() => {
        console.log('\nTest 3: Invalid step type');
        const invalidStepWorkflow = {
          name: "Invalid Step Test",
          steps: [
            { type: "invalid_action", selector: "#test" }
          ]
        };
        
        sendRequest(3, 'validate_workflow', { 
          workflow: JSON.stringify(invalidStepWorkflow) 
        });
      }, 2000);
      
      // Test 4: Missing required step properties
      setTimeout(() => {
        console.log('\nTest 4: Missing required properties');
        const missingPropsWorkflow = {
          name: "Missing Props Test",
          steps: [
            { type: "click" }, // Missing selector
            { type: "navigate" } // Missing url
          ]
        };
        
        sendRequest(4, 'validate_workflow', { 
          workflow: JSON.stringify(missingPropsWorkflow) 
        });
        
        // Exit after last test
        setTimeout(() => {
          serverProcess.kill();
          process.exit(0);
        }, 2000);
      }, 3000);
    }
  });
  
  function sendRequest(id, tool, args) {
    const request = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name: tool, arguments: args }
    };
    
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  }
  
  // Handle responses
  let responseBuffer = '';
  serverProcess.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          if (response.result && response.result.content) {
            console.log(`Result: ${response.result.content[0].text}`);
          }
        } catch (e) {
          // Continue
        }
      }
    }
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });
}

testValidation().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});