import React from 'react';
import { View, Text } from 'react-native';

export default function TestBasic() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
      <Text style={{ fontSize: 24, color: 'black' }}>🎉 React Native Web is working!</Text>
      <Text style={{ fontSize: 16, color: 'gray', marginTop: 10 }}>
        Backend URL: {process.env.EXPO_PUBLIC_BACKEND_URL}
      </Text>
      <Text style={{ fontSize: 16, color: 'gray', marginTop: 5 }}>
        Firebase Project: {process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_PROJECT_ID}
      </Text>
    </View>
  );
}