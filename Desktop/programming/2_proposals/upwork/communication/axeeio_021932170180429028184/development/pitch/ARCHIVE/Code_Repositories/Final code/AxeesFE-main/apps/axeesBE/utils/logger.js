/**
 * Simple logger utility for Axees platform
 * In production, consider using Winston or Bunyan
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

const logger = {
  /**
   * Log informational messages
   */
  info: (...args) => {
    if (!isTest) {
      console.log('[INFO]', new Date().toISOString(), ...args);
    }
  },

  /**
   * Log warning messages
   */
  warn: (...args) => {
    if (!isTest) {
      console.warn('[WARN]', new Date().toISOString(), ...args);
    }
  },

  /**
   * Log error messages
   */
  error: (...args) => {
    console.error('[ERROR]', new Date().toISOString(), ...args);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args) => {
    if (isDevelopment && !isTest) {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  },

  /**
   * Log success messages
   */
  success: (...args) => {
    if (!isTest) {
      console.log('[SUCCESS]', new Date().toISOString(), ...args);
    }
  },

  /**
   * Log database operations (only in development)
   */
  db: (...args) => {
    if (isDevelopment && !isTest) {
      console.log('[DB]', new Date().toISOString(), ...args);
    }
  }
};

module.exports = logger;