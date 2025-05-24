#!/usr/bin/env node
/**
 * Test script to validate the MCP server functionality
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  serverPath: path.join(__dirname, 'dist', 'index.js'),
  testTimeout: 30000,
  testUrl: `file://${path.join(__dirname, 'examples', 'test-example.html')}`,
  screenshotPath: path.join(__dirname, 'test-screenshot.png')
};

class MCPTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.log('Starting MCP server...');
      
      this.serverProcess = spawn('node', [TEST_CONFIG.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverOutput = '';
      
      this.serverProcess.stdout.on('data', (data) => {
        serverOutput += data.toString();
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

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.serverProcess.killed) {
          reject(new Error('Server startup timeout'));
        }
      }, 10000);
    });
  }

  async sendMCPRequest(request) {
    return new Promise((resolve, reject) => {
      if (!this.serverProcess) {
        reject(new Error('Server not running'));
        return;
      }

      let responseData = '';
      
      const onData = (data) => {
        responseData += data.toString();
        try {
          const response = JSON.parse(responseData);
          this.serverProcess.stdout.removeListener('data', onData);
          resolve(response);
        } catch (e) {
          // Continue collecting data
        }
      };

      this.serverProcess.stdout.on('data', onData);
      
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
      
      // Timeout for individual requests
      setTimeout(() => {
        this.serverProcess.stdout.removeListener('data', onData);
        reject(new Error('Request timeout'));
      }, 5000);
    });
  }

  async testListTools() {
    this.log('Testing list_tools...');
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    };

    try {
      const response = await this.sendMCPRequest(request);
      
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
        } else {
          this.log(`Missing tools: ${missingTools.join(', ')}`, 'error');
          this.testResults.push({ test: 'list_tools', status: 'fail', error: `Missing: ${missingTools.join(', ')}` });
        }
      } else {
        this.log('Invalid response format', 'error');
        this.testResults.push({ test: 'list_tools', status: 'fail', error: 'Invalid response' });
      }
    } catch (error) {
      this.log(`list_tools failed: ${error.message}`, 'error');
      this.testResults.push({ test: 'list_tools', status: 'fail', error: error.message });
    }
  }

  async testBrowserLaunch() {
    this.log('Testing browser launch...');
    
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'launch_browser',
        arguments: { headless: true }
      }
    };

    try {
      const response = await this.sendMCPRequest(request);
      
      if (response.result && response.result.content) {
        this.log('Browser launched successfully', 'success');
        this.testResults.push({ test: 'launch_browser', status: 'pass' });
      } else {
        this.log('Browser launch failed', 'error');
        this.testResults.push({ test: 'launch_browser', status: 'fail', error: 'No content in response' });
      }
    } catch (error) {
      this.log(`Browser launch failed: ${error.message}`, 'error');
      this.testResults.push({ test: 'launch_browser', status: 'fail', error: error.message });
    }
  }

  async stopServer() {
    if (this.serverProcess) {
      this.log('Stopping MCP server...');
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  async runTests() {
    try {
      await this.startServer();
      await this.testListTools();
      await this.testBrowserLaunch();
      
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
        this.log('All tests passed! 🎉', 'success');
        return true;
      } else {
        this.log('Some tests failed 😞', 'error');
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

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new MCPTester();
  
  tester.runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = MCPTester;