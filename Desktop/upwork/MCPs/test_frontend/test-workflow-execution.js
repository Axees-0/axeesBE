#!/usr/bin/env node
/**
 * Test the workflow execution functionality
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function testWorkflowExecution() {
  console.log('🚀 Testing workflow execution...\n');
  
  // Read the login test workflow
  const workflowPath = path.join(__dirname, 'workflows', 'login-test.json');
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
  
  console.log('📋 Workflow:', workflow.name);
  console.log('📝 Description:', workflow.description);
  console.log(`📊 Steps: ${workflow.steps.length}\n`);
  
  // Start the MCP server
  console.log('🔧 Starting MCP server...');
  const serverProcess = spawn('node', [path.join(__dirname, 'dist', 'index.js')], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let serverReady = false;
  
  // Wait for server to start
  serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Puppeteer MCP server running on stdio')) {
      serverReady = true;
      console.log('✅ MCP server started\n');
      
      // Execute the workflow
      executeWorkflow();
    }
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
  
  async function executeWorkflow() {
    console.log('🎯 Executing workflow...\n');
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'execute_workflow',
        arguments: {
          workflow: JSON.stringify(workflow),
          reportFormat: 'markdown'
        }
      }
    };
    
    // Send request
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    
    // Collect response
    let responseBuffer = '';
    
    const onData = (data) => {
      responseBuffer += data.toString();
      
      // Try to parse response
      const lines = responseBuffer.split('\n');
      responseBuffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.id === 1) {
              // Got our response
              serverProcess.stdout.removeListener('data', onData);
              
              if (response.result) {
                console.log('✅ Workflow executed successfully!\n');
                console.log('📄 Report:\n');
                console.log(response.result.content[0].text);
              } else if (response.error) {
                console.error('❌ Workflow execution failed:', response.error);
              }
              
              // Cleanup
              serverProcess.kill();
              process.exit(0);
            }
          } catch (e) {
            // Continue
          }
        }
      }
    };
    
    serverProcess.stdout.on('data', onData);
  }
  
  // Timeout
  setTimeout(() => {
    console.error('❌ Test timeout');
    serverProcess.kill();
    process.exit(1);
  }, 60000);
}

// Run test
testWorkflowExecution().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});