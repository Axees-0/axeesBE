export default {
  expo: {
    scheme: "axees",
    web: {
      bundler: "metro",
    },
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