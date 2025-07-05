export default {
  expo: {
    name: "axees",
    slug: "axees", 
    version: "1.0.0",
    scheme: "axees",
    platforms: ["web"],
    web: {
      bundler: "metro",
    },
    assetBundlePatterns: ["**/*"],
    icon: "./assets/icon.png",
    experiments: {
      typedRoutes: true,
    },
    plugins: [
      [
        "expo-router",
        {
          origin: false,
          root: "app",
          asyncRoutes: {
            android: false,
            default: false,
            ios: false,
          },
        },
      ],
    ],
  },
};