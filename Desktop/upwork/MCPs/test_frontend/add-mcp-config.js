#!/usr/bin/env node
/**
 * Script to add Puppeteer MCP server to Claude configuration
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(os.homedir(), '.claude.json');
const mcpServerPath = path.join(os.homedir(), '.claude', 'local', 'dist', 'index.js');

// MCP server configuration
const puppeteerMCP = {
  "command": "node",
  "args": [mcpServerPath],
  "name": "puppeteer-test",
  "description": "Puppeteer browser automation for frontend testing"
};

try {
  // Read the existing config
  console.log('Reading Claude configuration...');
  const configContent = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configContent);
  
  // Find the current project path
  const localProjectPath = path.join(os.homedir(), '.claude', 'local');
  
  // Check if this project already has mcpServers
  if (!config.projects) {
    config.projects = {};
  }
  
  if (!config.projects[localProjectPath]) {
    config.projects[localProjectPath] = {
      allowedTools: [],
      mcpServers: {}
    };
  }
  
  if (!config.projects[localProjectPath].mcpServers) {
    config.projects[localProjectPath].mcpServers = {};
  }
  
  // Add the Puppeteer MCP server
  config.projects[localProjectPath].mcpServers['puppeteer-test'] = puppeteerMCP;
  
  // Also add it to the global mcpServers if it exists
  if (config.mcpServers) {
    config.mcpServers['puppeteer-test'] = puppeteerMCP;
  }
  
  // Write the updated config back
  console.log('Adding Puppeteer MCP server to configuration...');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('✅ Successfully added Puppeteer MCP server!');
  console.log(`\nMCP Server added at: ${mcpServerPath}`);
  console.log('\nTo use it:');
  console.log('1. Restart Claude Code CLI');
  console.log('2. The Puppeteer tools will be available in your sessions');
  console.log('\nAvailable tools:');
  console.log('- launch_browser');
  console.log('- navigate');
  console.log('- click');
  console.log('- type');
  console.log('- screenshot');
  console.log('- get_text');
  console.log('- wait_for_selector');
  console.log('- evaluate');
  console.log('- close_browser');
  
} catch (error) {
  console.error('❌ Error updating Claude configuration:', error.message);
  process.exit(1);
}