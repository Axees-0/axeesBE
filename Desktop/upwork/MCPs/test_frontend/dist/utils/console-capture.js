"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleCapture = void 0;
class ConsoleCapture {
    logs = [];
    filters = {};
    constructor(options) {
        if (options?.levels) {
            this.filters.levels = options.levels;
        }
        if (options?.includePatterns) {
            this.filters.includePatterns = options.includePatterns.map(p => new RegExp(p));
        }
        if (options?.excludePatterns) {
            this.filters.excludePatterns = options.excludePatterns.map(p => new RegExp(p));
        }
    }
    /**
     * Attach console capture to a page
     */
    attach(page) {
        page.on('console', (msg) => {
            const log = this.processConsoleMessage(msg);
            if (log && this.shouldCapture(log)) {
                this.logs.push(log);
            }
        });
        // Also capture page errors
        page.on('pageerror', (error) => {
            this.logs.push({
                timestamp: new Date(),
                level: 'error',
                message: error.message,
                stackTrace: error.stack
            });
        });
        // Capture unhandled promise rejections
        page.on('error', (error) => {
            this.logs.push({
                timestamp: new Date(),
                level: 'error',
                message: `Unhandled error: ${error.message}`,
                stackTrace: error.stack
            });
        });
    }
    /**
     * Process a console message
     */
    processConsoleMessage(msg) {
        try {
            const location = msg.location();
            return {
                timestamp: new Date(),
                level: msg.type(),
                message: msg.text(),
                source: location.url || undefined,
                stackTrace: msg.stackTrace()?.map(frame => `  at ${frame.url}:${frame.lineNumber}:${frame.columnNumber}`).join('\n')
            };
        }
        catch (error) {
            // Failed to process message
            return null;
        }
    }
    /**
     * Check if a log should be captured based on filters
     */
    shouldCapture(log) {
        // Check level filter
        if (this.filters.levels && !this.filters.levels.includes(log.level)) {
            return false;
        }
        // Check exclude patterns
        if (this.filters.excludePatterns) {
            for (const pattern of this.filters.excludePatterns) {
                if (pattern.test(log.message)) {
                    return false;
                }
            }
        }
        // Check include patterns
        if (this.filters.includePatterns && this.filters.includePatterns.length > 0) {
            let matches = false;
            for (const pattern of this.filters.includePatterns) {
                if (pattern.test(log.message)) {
                    matches = true;
                    break;
                }
            }
            if (!matches) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get all captured logs
     */
    getLogs() {
        return [...this.logs];
    }
    /**
     * Get logs by level
     */
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }
    /**
     * Get error logs
     */
    getErrors() {
        return this.getLogsByLevel('error');
    }
    /**
     * Get warning logs
     */
    getWarnings() {
        return this.getLogsByLevel('warn');
    }
    /**
     * Clear captured logs
     */
    clear() {
        this.logs = [];
    }
    /**
     * Export logs as formatted string
     */
    export(format = 'text') {
        if (format === 'json') {
            return JSON.stringify(this.logs, null, 2);
        }
        return this.logs.map(log => {
            const timestamp = log.timestamp.toISOString();
            const level = log.level.toUpperCase().padEnd(5);
            const source = log.source ? ` [${log.source}]` : '';
            let message = `[${timestamp}] ${level}${source} ${log.message}`;
            if (log.stackTrace) {
                message += '\n' + log.stackTrace;
            }
            return message;
        }).join('\n');
    }
    /**
     * Get summary of captured logs
     */
    getSummary() {
        const summary = {
            total: this.logs.length,
            error: 0,
            warn: 0,
            info: 0,
            log: 0,
            debug: 0
        };
        for (const log of this.logs) {
            if (summary[log.level] !== undefined) {
                summary[log.level]++;
            }
        }
        return summary;
    }
}
exports.ConsoleCapture = ConsoleCapture;
