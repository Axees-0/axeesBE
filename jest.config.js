module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'node'],
  
  // Transform files with explicit Babel configuration
  transform: {
    '^.+\\.js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs'
        }]
      ],
      plugins: [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-transform-async-to-generator'
      ]
    }]
  },
  
  // Transform ignore patterns - allow transformation of specific node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(openai|stripe|@apidevtools|@babel/runtime)/)'
  ],
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Module name mapping for better resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/uploads/',
    '/docs/',
    '/coverage/'
  ],
  
  // Mock and cleanup configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Async operation handling
  detectOpenHandles: true,
  forceExit: true,
  
  // Coverage configuration
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  
  // Force coverage collection
  collectCoverage: false,
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Error handling
  errorOnDeprecated: false,
  
  // Max workers for better performance
  maxWorkers: '50%',
  
  // Verbose output
  verbose: true,
  
  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Watch plugins (removed as packages not installed)
  watchPlugins: []
};