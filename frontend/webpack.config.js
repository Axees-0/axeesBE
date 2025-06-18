// apps/axees/webpack.config.js
const path = require('path');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = async function (env, argv) {
  /** ------------------------------------------------------------------
   *  1. Get the stock Expo / CRA-style config first
   *  ---------------------------------------------------------------- */
  const config = await createExpoWebpackConfigAsync(env, argv);

  /** ------------------------------------------------------------------
   *  2. Always alias `react-native` → `react-native-web`  (your original)
   *  ---------------------------------------------------------------- */
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'react-native$': 'react-native-web',
  };

  /** ------------------------------------------------------------------
   *  3. In **production** add long-term content hashes to every bundle
   *     so CloudFront & the browser pick up fresh files automatically
   *  ---------------------------------------------------------------- */
  if (config.mode === 'production') {
    // JS / CSS chunks
    config.output.filename      = 'static/js/[name].[contenthash:8].js';
    config.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';

    // other asset types (images, fonts, …) handled by asset modules
    config.module.rules.forEach((rule) => {
      if (rule.type === 'asset/resource' || rule.type === 'asset') {
        rule.generator = rule.generator || {};
        rule.generator.filename = 'static/media/[name].[hash][ext]';
      }
    });

    // optional – create asset-manifest.json (handy for debugging)
    config.plugins.push(
      new WebpackManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: '/',
        generate: (seed, files) =>
          files.reduce((manifest, { name, path: filePath }) => {
            manifest[name] = filePath;
            return manifest;
          }, seed),
      })
    );
  }

  /** ------------------------------------------------------------------
   *  4. Add bundle analyzer when ANALYZE environment variable is set
   *  ---------------------------------------------------------------- */
  if (process.env.ANALYZE === 'true') {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        analyzerPort: 8888,
        openAnalyzer: true,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
      })
    );
  }

  /** ------------------------------------------------------------------
   *  5. Optimize chunk splitting for better performance
   *  ---------------------------------------------------------------- */
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        // Vendor chunk
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
          priority: 20,
        },
        // React-specific chunk
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|react-native-web)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 30,
        },
        // Common chunk for code used in multiple places
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    },
  };

  /** ------------------------------------------------------------------
   *  6. Done – let Expo/webpack do the heavy lifting
   *  ---------------------------------------------------------------- */
  return config;
};
