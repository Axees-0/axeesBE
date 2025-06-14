module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        },
        modules: 'commonjs',
        useBuiltIns: 'usage',
        corejs: {
          version: 3,
          proposals: true
        },
        debug: false
      }
    ]
  ],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: 3,
        helpers: true,
        regenerator: true,
        useESModules: false
      }
    ],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-async-to-generator'
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            },
            modules: 'commonjs',
            useBuiltIns: 'usage',
            corejs: {
              version: 3,
              proposals: true
            }
          }
        ]
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: 3,
            helpers: true,
            regenerator: true,
            useESModules: false
          }
        ],
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-transform-async-to-generator'
      ]
    },
    development: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            },
            modules: 'commonjs',
            useBuiltIns: 'usage',
            corejs: {
              version: 3,
              proposals: true
            }
          }
        ]
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: 3,
            helpers: true,
            regenerator: true,
            useESModules: false
          }
        ],
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-transform-async-to-generator'
      ]
    },
    production: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: '18'
            },
            modules: 'commonjs',
            useBuiltIns: 'usage',
            corejs: {
              version: 3,
              proposals: true
            }
          }
        ]
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: 3,
            helpers: true,
            regenerator: true,
            useESModules: false
          }
        ],
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-transform-async-to-generator'
      ]
    }
  }
};