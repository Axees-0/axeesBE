"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGenerator = void 0;
class ReportGenerator {
    /**
     * Generate a report in the specified format
     */
    generate(result, format = 'markdown') {
        if (format === 'json') {
            return this.generateJSON(result);
        }
        return this.generateMarkdown(result);
    }
    /**
     * Generate a JSON report
     */
    generateJSON(result) {
        return JSON.stringify(result, null, 2);
    }
    /**
     * Generate a Markdown report
     */
    generateMarkdown(result) {
        const sections = [];
        // Header
        sections.push(this.generateHeader(result));
        // Summary
        sections.push(this.generateSummary(result));
        // Timeline
        sections.push(this.generateTimeline(result));
        // Console output
        if (result.consoleLogs.length > 0) {
            sections.push(this.generateConsoleSection(result));
        }
        // Network activity
        if (result.networkActivity.length > 0) {
            sections.push(this.generateNetworkSection(result));
        }
        // Screenshots
        if (result.screenshots.length > 0) {
            sections.push(this.generateScreenshotSection(result));
        }
        // Performance metrics
        sections.push(this.generatePerformanceSection(result));
        // Detailed steps
        sections.push(this.generateDetailedSteps(result));
        return sections.join('\n\n');
    }
    /**
     * Generate report header
     */
    generateHeader(result) {
        const status = result.status === 'success' ? '✅' :
            result.status === 'failure' ? '❌' : '⚠️';
        return `# Test Execution Report

## Workflow: ${result.workflow.name}
**Status**: ${status} ${result.status.charAt(0).toUpperCase() + result.status.slice(1)}
**Duration**: ${this.formatDuration(result.duration)}
**Executed**: ${result.startTime.toLocaleString()}`;
    }
    /**
     * Generate summary section
     */
    generateSummary(result) {
        const { summary } = result;
        const successRate = summary.totalSteps > 0
            ? Math.round((summary.passedSteps / summary.totalSteps) * 100)
            : 0;
        return `## Summary

- **Total Steps**: ${summary.totalSteps}
- **Passed**: ${summary.passedSteps} ✅
- **Failed**: ${summary.failedSteps} ❌
- **Skipped**: ${summary.skippedSteps} ⏭️
- **Success Rate**: ${successRate}%

${result.error ? `### Error\n\`\`\`\n${result.error}\n\`\`\`` : ''}`;
    }
    /**
     * Generate timeline section
     */
    generateTimeline(result) {
        const lines = ['## Timeline'];
        result.steps.forEach((step, index) => {
            const stepDef = result.workflow.steps[index];
            const icon = step.success ? '✅' : '❌';
            const duration = step.duration ? `(${step.duration}ms)` : '';
            const description = stepDef.description || `${stepDef.type} ${stepDef.selector || ''}`.trim();
            lines.push(`${index + 1}. ${icon} ${description} ${duration}`);
            if (step.error) {
                lines.push(`   - Error: ${step.error}`);
            }
        });
        return lines.join('\n');
    }
    /**
     * Generate console output section
     */
    generateConsoleSection(result) {
        const lines = ['## Console Output'];
        // Group logs by level
        const errorLogs = result.consoleLogs.filter(log => log.level === 'error');
        const warnLogs = result.consoleLogs.filter(log => log.level === 'warn');
        const infoLogs = result.consoleLogs.filter(log => log.level === 'info' || log.level === 'log');
        if (errorLogs.length > 0) {
            lines.push('\n### Errors');
            errorLogs.forEach(log => {
                lines.push(`- ❌ ${log.message}`);
                if (log.stackTrace) {
                    lines.push(`  \`\`\`\n${log.stackTrace}\n  \`\`\``);
                }
            });
        }
        if (warnLogs.length > 0) {
            lines.push('\n### Warnings');
            warnLogs.forEach(log => {
                lines.push(`- ⚠️ ${log.message}`);
            });
        }
        if (infoLogs.length > 0 && infoLogs.length <= 10) {
            lines.push('\n### Info');
            infoLogs.forEach(log => {
                lines.push(`- ℹ️ ${log.message}`);
            });
        }
        else if (infoLogs.length > 10) {
            lines.push(`\n### Info\n- ℹ️ ${infoLogs.length} info messages logged`);
        }
        return lines.join('\n');
    }
    /**
     * Generate network activity section
     */
    generateNetworkSection(result) {
        const lines = ['## Network Activity'];
        // Group by status
        const successful = result.networkActivity.filter(req => req.status && req.status < 400);
        const failed = result.networkActivity.filter(req => req.error || (req.status && req.status >= 400));
        lines.push(`\n**Total Requests**: ${result.networkActivity.length}`);
        lines.push(`**Successful**: ${successful.length}`);
        lines.push(`**Failed**: ${failed.length}`);
        if (failed.length > 0) {
            lines.push('\n### Failed Requests');
            failed.forEach(req => {
                const status = req.status ? `(${req.status})` : '';
                const error = req.error ? ` - ${req.error}` : '';
                lines.push(`- ${req.method} ${req.url} ${status}${error}`);
            });
        }
        // Show slowest requests
        const slowRequests = result.networkActivity
            .filter(req => req.responseTime && req.responseTime > 1000)
            .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0))
            .slice(0, 5);
        if (slowRequests.length > 0) {
            lines.push('\n### Slow Requests (>1s)');
            slowRequests.forEach(req => {
                lines.push(`- ${req.method} ${req.url} (${req.responseTime}ms)`);
            });
        }
        return lines.join('\n');
    }
    /**
     * Generate screenshot section
     */
    generateScreenshotSection(result) {
        const lines = ['## Screenshots'];
        result.screenshots.forEach((screenshot, index) => {
            const filename = screenshot.split('/').pop() || screenshot;
            lines.push(`${index + 1}. [${filename}](${screenshot})`);
        });
        return lines.join('\n');
    }
    /**
     * Generate performance section
     */
    generatePerformanceSection(result) {
        const avgStepDuration = result.steps.length > 0
            ? Math.round(result.steps.reduce((sum, step) => sum + (step.duration || 0), 0) / result.steps.length)
            : 0;
        const slowestStep = result.steps.reduce((slowest, step, index) => {
            if (!step.duration)
                return slowest;
            if (!slowest || step.duration > slowest.duration) {
                return { step, index, duration: step.duration };
            }
            return slowest;
        }, null);
        const lines = ['## Performance Summary'];
        lines.push(`- **Total Duration**: ${this.formatDuration(result.duration)}`);
        lines.push(`- **Average Step Duration**: ${avgStepDuration}ms`);
        if (slowestStep) {
            const stepDef = result.workflow.steps[slowestStep.index];
            lines.push(`- **Slowest Step**: ${stepDef.description || stepDef.type} (${slowestStep.duration}ms)`);
        }
        return lines.join('\n');
    }
    /**
     * Generate detailed steps section
     */
    generateDetailedSteps(result) {
        const lines = ['## Detailed Step Results'];
        result.steps.forEach((step, index) => {
            const stepDef = result.workflow.steps[index];
            lines.push(`\n### Step ${index + 1}: ${stepDef.description || stepDef.type}`);
            lines.push(`- **Type**: ${stepDef.type}`);
            if (stepDef.selector)
                lines.push(`- **Selector**: \`${stepDef.selector}\``);
            if (stepDef.value)
                lines.push(`- **Value**: ${JSON.stringify(stepDef.value)}`);
            lines.push(`- **Status**: ${step.success ? '✅ Success' : '❌ Failed'}`);
            if (step.duration)
                lines.push(`- **Duration**: ${step.duration}ms`);
            if (step.retries)
                lines.push(`- **Retries**: ${step.retries}`);
            if (step.error) {
                lines.push(`- **Error**: ${step.error}`);
            }
            if (step.data) {
                lines.push(`- **Result Data**: \`\`\`json\n${JSON.stringify(step.data, null, 2)}\n\`\`\``);
            }
        });
        return lines.join('\n');
    }
    /**
     * Format duration in human-readable format
     */
    formatDuration(ms) {
        if (ms < 1000)
            return `${ms}ms`;
        if (ms < 60000)
            return `${(ms / 1000).toFixed(1)}s`;
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
}
exports.ReportGenerator = ReportGenerator;
