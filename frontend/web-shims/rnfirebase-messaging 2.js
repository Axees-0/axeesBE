// Stub for @react-native-firebase/messaging on web
const messaging = () => ({
  requestPermission: async () => 1,
  getToken: async () => 'web-mock-token',
  getAPNSToken: async () => null,
  onMessage: () => () => {},
  setBackgroundMessageHandler: () => {},
  AuthorizationStatus: {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
});

messaging.AuthorizationStatus = {
  AUTHORIZED: 1,
  PROVISIONAL: 2,
};

export default messaging;