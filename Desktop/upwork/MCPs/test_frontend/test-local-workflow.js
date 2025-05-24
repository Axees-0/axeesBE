#!/usr/bin/env node
/**
 * Test workflow with local HTML file
 */

const { spawn } = require('child_process');
const path = require('path');

async function testLocalWorkflow() {
  console.log('🚀 Testing local HTML workflow...\n');
  
  // Workflow for local HTML testing
  const localWorkflow = {
    name: "Local Form Test",
    description: "Test the local login form",
    config: {
      headless: true,
      viewport: { width: 1280, height: 720 }
    },
    steps: [
      {
        type: "navigate",
        url: `file://${path.join(__dirname, 'examples', 'test-example.html')}`,
        description: "Navigate to local test page"
      },
      {
        type: "screenshot",
        description: "Initial page state",
        screenshot: { name: "initial-state", fullPage: true }
      },
      {
        type: "type",
        selector: "#username",
        value: "wronguser",
        description: "Enter wrong username"
      },
      {
        type: "type",
        selector: "#password", 
        value: "wrongpass",
        description: "Enter wrong password"
      },
      {
        type: "click",
        selector: "#submit-btn",
        description: "Click submit"
      },
      {
        type: "waitForSelector",
        selector: "#error-msg[style*='display: block']",
        description: "Wait for error message"
      },
      {
        type: "assertText",
        selector: "#error-msg",
        expected: "Invalid credentials. Please try again.",
        description: "Verify error message"
      },
      {
        type: "evaluate",
        script: "document.getElementById('username').value = ''; document.getElementById('password').value = ''",
        description: "Clear form"
      },
      {
        type: "type",
        selector: "#username",
        value: "testuser",
        description: "Enter valid username"
      },
      {
        type: "type",
        selector: "#password",
        value: "testpass",
        description: "Enter valid password"
      },
      {
        type: "click",
        selector: "#submit-btn",
        description: "Submit valid credentials"
      },
      {
        type: "waitForSelector",
        selector: "#success-msg[style*='display: block']",
        description: "Wait for success"
      },
      {
        type: "screenshot",
        description: "Success state",
        screenshot: { name: "success-state", fullPage: true }
      }
    ]
  };
  
  // Start server
  const serverProcess = spawn('node', [path.join(__dirname, 'dist', 'index.js')], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let requestSent = false;
  
  serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    
    if (output.includes('Puppeteer MCP server running') && !requestSent) {
      requestSent = true;
      console.log('✅ Server ready\n');
      
      setTimeout(() => {
        console.log('Executing local workflow...');
        
        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'execute_workflow',
            arguments: {
              workflow: JSON.stringify(localWorkflow),
              reportFormat: 'markdown'
            }
          }
        };
        
        serverProcess.stdin.write(JSON.stringify(request) + '\n');
        
        let responseBuffer = '';
        
        serverProcess.stdout.on('data', (data) => {
          responseBuffer += data.toString();
          
          const lines = responseBuffer.split('\n');
          responseBuffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const response = JSON.parse(line);
                if (response.id === 1) {
                  if (response.result && response.result.content) {
                    const report = response.result.content[0].text;
                    
                    // Extract key info from report
                    console.log('\n=== Test Results ===\n');
                    
                    const statusMatch = report.match(/\*\*Status\*\*: (.+)/);
                    const summaryMatch = report.match(/- \*\*Passed\*\*: (\d+)/);
                    const failedMatch = report.match(/- \*\*Failed\*\*: (\d+)/);
                    
                    if (statusMatch) console.log(`Status: ${statusMatch[1]}`);
                    if (summaryMatch) console.log(`Passed Steps: ${summaryMatch[1]}`);
                    if (failedMatch) console.log(`Failed Steps: ${failedMatch[1]}`);
                    
                    // Show timeline
                    const timelineSection = report.match(/## Timeline\n([\s\S]*?)(?=\n##|\n*$)/);
                    if (timelineSection) {
                      console.log('\nTimeline:');
                      console.log(timelineSection[1].trim());
                    }
                    
                    // Show screenshots
                    const screenshotsSection = report.match(/## Screenshots\n([\s\S]*?)(?=\n##|\n*$)/);
                    if (screenshotsSection) {
                      console.log('\nScreenshots captured:');
                      console.log(screenshotsSection[1].trim());
                    }
                  }
                  
                  setTimeout(() => {
                    serverProcess.kill();
                    process.exit(0);
                  }, 1000);
                }
              } catch (e) {
                // Continue
              }
            }
          }
        });
      }, 1000);
    }
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });
  
  setTimeout(() => {
    console.error('❌ Timeout');
    serverProcess.kill();
    process.exit(1);
  }, 30000);
}

testLocalWorkflow().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});