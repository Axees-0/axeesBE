const { getDefaultConfig } = require('expo/metro-config');
const path                 = require('path');
const findWorkspaceRoot    = require('find-yarn-workspace-root');
const { resolve }          = require('metro-resolver');   // ← NEW

module.exports = (() => {
  const projectRoot  = __dirname;
  const monorepoRoot = findWorkspaceRoot(projectRoot) || projectRoot;

  const config                 = getDefaultConfig(projectRoot);
  const { transformer, resolver } = config;

  /* watch the monorepo root */
  config.watchFolders = [monorepoRoot];

  /* svg transformer */
  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  };

  /* base resolver tweaks */
  config.resolver = {
    ...resolver,
    assetExts : resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
    nodeModulesPaths: [
      path.join(projectRoot, 'node_modules'),
      ...(monorepoRoot !== projectRoot ? [path.join(monorepoRoot, 'node_modules')] : []),
    ],
    extraNodeModules: {
      ...(resolver.extraNodeModules || {}),
      /* use react‑native‑web for the core package */
      'react-native': path.join(projectRoot, 'node_modules', 'react-native-web'),
      /* stub the native Stripe SDK */
      '@stripe/stripe-react-native': path.join(projectRoot, 'web-shims/stripe-react-native.js'),
      // ➜ Stub native Firebase packages on web
      '@react-native-firebase/app'      : path.join(projectRoot, 'web-shims/rnfirebase-app.js'),
      '@react-native-firebase/messaging': path.join(projectRoot, 'web-shims/rnfirebase-messaging.js'),
    },
  };

  /* ✨ custom resolveRequest — add Firebase wildcard */
const emptyStub = path.join(projectRoot, 'web-shims/rn-empty.js');

config.resolver.resolveRequest = (ctx, moduleName, platform) => {
  if (platform === 'web') {
    /* a) legacy deep RN internals */
    if (moduleName.startsWith('react-native/Libraries/')) {
      return { type: 'sourceFile', filePath: emptyStub };
    }
    /* b) 𝗡𝗘𝗪: anything that begins with @react-native-firebase/ */
    if (moduleName.startsWith('@react-native-firebase/')) {
      return { type: 'sourceFile', filePath: emptyStub };
    }
  }
  return resolve(ctx, moduleName, platform);
};


  return config;
})();
