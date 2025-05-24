#!/usr/bin/env node
/**
 * Integration test for MCP server using stdio communication
 */

const { spawn } = require('child_process');
const path = require('path');

class MCPIntegrationTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
    this.requestId = 1;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 23);
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.log('Starting MCP server...');
      
      this.serverProcess = spawn('node', [path.join(__dirname, 'dist', 'index.js')], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Puppeteer MCP server running on stdio')) {
          this.log('MCP server started successfully', 'success');
          resolve();
        }
      });

      this.serverProcess.on('error', (error) => {
        this.log(`Server error: ${error.message}`, 'error');
        reject(error);
      });

      setTimeout(() => {
        if (!this.serverProcess.killed) {
          reject(new Error('Server startup timeout'));
        }
      }, 10000);
    });
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.serverProcess) {
        reject(new Error('Server not running'));
        return;
      }

      const request = {
        jsonrpc: '2.0',
        id: this.requestId++,
        method: method,
        params: params
      };

      let responseBuffer = '';
      let timeout;

      const onData = (data) => {
        responseBuffer += data.toString();
        
        // Try to parse complete JSON responses
        const lines = responseBuffer.split('\n');
        responseBuffer = lines.pop() || ''; // Keep incomplete line

        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                clearTimeout(timeout);
                this.serverProcess.stdout.removeListener('data', onData);
                resolve(response);
                return;
              }
            } catch (e) {
              // Continue trying to parse
            }
          }
        }
      };

      this.serverProcess.stdout.on('data', onData);
      
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
      
      timeout = setTimeout(() => {
        this.serverProcess.stdout.removeListener('data', onData);
        reject(new Error(`Request timeout for method: ${method}`));
      }, 15000);
    });
  }

  async testListTools() {
    this.log('Testing tools/list...');
    
    try {
      const response = await this.sendRequest('tools/list');
      
      if (response.result && response.result.tools) {
        const tools = response.result.tools;
        this.log(`Found ${tools.length} tools`, 'success');
        
        const expectedTools = [
          'launch_browser', 'navigate', 'click', 'type', 
          'screenshot', 'get_text', 'wait_for_selector', 
          'evaluate', 'close_browser'
        ];
        
        const foundTools = tools.map(t => t.name);
        const missingTools = expectedTools.filter(t => !foundTools.includes(t));
        
        if (missingTools.length === 0) {
          this.log('All expected tools found', 'success');
          this.testResults.push({ test: 'list_tools', status: 'pass' });
          return true;
        } else {
          this.log(`Missing tools: ${missingTools.join(', ')}`, 'error');
          this.testResults.push({ test: 'list_tools', status: 'fail', error: `Missing: ${missingTools.join(', ')}` });
          return false;
        }
      } else {
        this.log('Invalid response format', 'error');
        this.testResults.push({ test: 'list_tools', status: 'fail', error: 'Invalid response' });
        return false;
      }
    } catch (error) {
      this.log(`list_tools failed: ${error.message}`, 'error');
      this.testResults.push({ test: 'list_tools', status: 'fail', error: error.message });
      return false;
    }
  }

  async testBrowserWorkflow() {
    this.log('Testing complete browser workflow...');
    
    try {
      // 1. Launch browser
      this.log('Step 1: Launching browser...');
      const launchResponse = await this.sendRequest('tools/call', {
        name: 'launch_browser',
        arguments: { headless: true }
      });
      
      if (!launchResponse.result) {
        throw new Error('Browser launch failed');
      }
      this.log('Browser launched successfully', 'success');

      // 2. Navigate to test page
      this.log('Step 2: Navigating to test page...');
      const testUrl = `file://${path.join(__dirname, 'examples', 'test-example.html')}`;
      const navResponse = await this.sendRequest('tools/call', {
        name: 'navigate',
        arguments: { url: testUrl }
      });
      
      if (!navResponse.result) {
        throw new Error('Navigation failed');
      }
      this.log('Navigation successful', 'success');

      // 3. Fill form fields
      this.log('Step 3: Filling form fields...');
      await this.sendRequest('tools/call', {
        name: 'type',
        arguments: { selector: '#username', text: 'testuser' }
      });
      
      await this.sendRequest('tools/call', {
        name: 'type',
        arguments: { selector: '#password', text: 'testpass' }
      });
      this.log('Form fields filled', 'success');

      // 4. Click submit button
      this.log('Step 4: Clicking submit button...');
      await this.sendRequest('tools/call', {
        name: 'click',
        arguments: { selector: '#submit-btn' }
      });
      this.log('Submit button clicked', 'success');

      // 5. Wait for success message
      this.log('Step 5: Waiting for success message...');
      await this.sendRequest('tools/call', {
        name: 'wait_for_selector',
        arguments: { selector: '#success-msg[style*="display: block"]' }
      });
      this.log('Success message appeared', 'success');

      // 6. Get success message text
      this.log('Step 6: Getting success message text...');
      const textResponse = await this.sendRequest('tools/call', {
        name: 'get_text',
        arguments: { selector: '#success-msg' }
      });
      
      if (textResponse.result && textResponse.result.content) {
        const successText = textResponse.result.content[0].text;
        this.log(`Success message: "${successText}"`, 'success');
      }

      // 7. Take screenshot
      this.log('Step 7: Taking screenshot...');
      await this.sendRequest('tools/call', {
        name: 'screenshot',
        arguments: { 
          path: path.join(__dirname, 'test-mcp-workflow.png'),
          fullPage: true 
        }
      });
      this.log('Screenshot taken', 'success');

      // 8. Close browser
      this.log('Step 8: Closing browser...');
      await this.sendRequest('tools/call', {
        name: 'close_browser',
        arguments: {}
      });
      this.log('Browser closed', 'success');

      this.testResults.push({ test: 'browser_workflow', status: 'pass' });
      return true;

    } catch (error) {
      this.log(`Browser workflow failed: ${error.message}`, 'error');
      this.testResults.push({ test: 'browser_workflow', status: 'fail', error: error.message });
      return false;
    }
  }

  async stopServer() {
    if (this.serverProcess) {
      this.log('Stopping MCP server...');
      this.serverProcess.kill('SIGTERM');
      
      // Give it time to cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!this.serverProcess.killed) {
        this.serverProcess.kill('SIGKILL');
      }
      
      this.serverProcess = null;
    }
  }

  async runAllTests() {
    try {
      await this.startServer();
      
      const listToolsSuccess = await this.testListTools();
      if (!listToolsSuccess) {
        this.log('Skipping workflow test due to list_tools failure', 'error');
      } else {
        await this.testBrowserWorkflow();
      }
      
      this.log('\n=== Test Results ===');
      let passCount = 0;
      let failCount = 0;
      
      this.testResults.forEach(result => {
        if (result.status === 'pass') {
          this.log(`${result.test}: PASS`, 'success');
          passCount++;
        } else {
          this.log(`${result.test}: FAIL - ${result.error}`, 'error');
          failCount++;
        }
      });
      
      this.log(`\nSummary: ${passCount} passed, ${failCount} failed`);
      
      if (failCount === 0) {
        this.log('🎉 All MCP integration tests passed!', 'success');
        return true;
      } else {
        this.log('😞 Some MCP integration tests failed', 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      return false;
    } finally {
      await this.stopServer();
    }
  }
}

// Run tests
if (require.main === module) {
  const tester = new MCPIntegrationTester();
  
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Integration test runner failed:', error);
      process.exit(1);
    });
}

module.exports = MCPIntegrationTester;