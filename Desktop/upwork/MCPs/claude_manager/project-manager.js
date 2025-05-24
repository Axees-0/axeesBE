#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { program } = require('commander');

// Default configuration
const DEFAULT_PARENT_DIR = process.env.PROJECT_PARENT_DIR || path.join(process.env.HOME, 'projects');

/**
 * Create or navigate to project directory
 * @param {string} projectId - The project ID
 * @param {string} parentDir - Parent directory for projects
 * @returns {string} - The full path to the project directory
 */
function ensureProjectDirectory(projectId, parentDir = DEFAULT_PARENT_DIR) {
    const projectPath = path.join(parentDir, projectId);
    
    try {
        if (!fs.existsSync(projectPath)) {
            fs.mkdirSync(projectPath, { recursive: true });
            console.log(`✅ Created new project directory: ${projectPath}`);
        } else {
            console.log(`📁 Project directory already exists: ${projectPath}`);
        }
        return projectPath;
    } catch (error) {
        console.error(`❌ Error creating directory: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Change to project directory
 * @param {string} projectPath - Path to the project directory
 */
function navigateToDirectory(projectPath) {
    try {
        process.chdir(projectPath);
        console.log(`📍 Changed to directory: ${process.cwd()}`);
    } catch (error) {
        console.error(`❌ Error changing directory: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Set Claude configuration
 * @param {string} key - Configuration key
 * @param {string} value - Configuration value
 */
function setClaudeConfig(key, value) {
    try {
        execSync(`claude config set ${key} ${value}`, { stdio: 'inherit' });
        console.log(`✅ Claude config set: ${key}=${value}`);
    } catch (error) {
        console.error(`❌ Error setting Claude config: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Start Claude with optional initial command
 * @param {string} initialCommand - Initial command to run
 */
function startClaude(initialCommand = null) {
    try {
        const args = [];
        if (initialCommand) {
            args.push('-m', initialCommand);
        }
        
        console.log('🚀 Starting Claude...');
        const claude = spawn('claude', args, { 
            stdio: 'inherit',
            shell: true 
        });
        
        claude.on('error', (error) => {
            console.error(`❌ Error starting Claude: ${error.message}`);
            process.exit(1);
        });
        
        claude.on('exit', (code) => {
            process.exit(code);
        });
    } catch (error) {
        console.error(`❌ Error launching Claude: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Execute a command and return
 * @param {string} command - Command to execute
 */
function executeCommand(command) {
    try {
        console.log(`🔧 Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });
        console.log('✅ Command executed successfully');
    } catch (error) {
        console.error(`❌ Error executing command: ${error.message}`);
        process.exit(1);
    }
}

// CLI setup
program
    .name('project-manager')
    .description('Modular project management tool for Claude development')
    .version('1.0.0');

program
    .option('-i, --id <projectId>', 'Project ID')
    .option('-p, --parent <dir>', 'Parent directory for projects', DEFAULT_PARENT_DIR)
    .option('-n, --navigate', 'Navigate to project directory')
    .option('-c, --config <key=value>', 'Set Claude config (format: key=value)')
    .option('-s, --start', 'Start Claude')
    .option('-m, --message <command>', 'Initial command for Claude')
    .option('-e, --execute <command>', 'Execute a shell command')
    .option('-a, --auto', 'Auto mode: create/navigate, set trust config, and start Claude')
    .parse(process.argv);

const options = program.opts();

// Main execution logic
async function main() {
    let projectPath = null;
    
    // Handle project directory creation/navigation
    if (options.id) {
        projectPath = ensureProjectDirectory(options.id, options.parent);
        
        // Auto-navigate if navigate option is set or in auto mode
        if (options.navigate || options.auto) {
            navigateToDirectory(projectPath);
        }
    }
    
    // Handle Claude config
    if (options.config) {
        const [key, value] = options.config.split('=');
        if (key && value) {
            setClaudeConfig(key, value);
        } else {
            console.error('❌ Invalid config format. Use: key=value');
            process.exit(1);
        }
    }
    
    // Auto mode: set trust dialog config
    if (options.auto && options.id) {
        setClaudeConfig('hasTrustDialogAccepted', 'true');
    }
    
    // Execute command if provided
    if (options.execute) {
        executeCommand(options.execute);
    }
    
    // Start Claude (should be last as it's interactive)
    if (options.start || options.auto) {
        startClaude(options.message);
    }
    
    // If no interactive command was run, exit
    if (!options.start && !options.auto) {
        console.log('✨ All tasks completed');
    }
}

// Run the main function
main().catch(error => {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
});