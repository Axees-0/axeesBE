import React from 'react';
import { View, Text } from 'react-native';

const TestSimple = () => {
  console.log('TestSimple component is rendering');
  return (
    <View style={{ padding: 20, backgroundColor: 'red', minHeight: 500 }}>
      <Text style={{ fontSize: 24, color: 'white', fontWeight: 'bold' }}>
        TEST COMPONENT LOADED SUCCESSFULLY
      </Text>
      <Text style={{ fontSize: 16, color: 'white', marginTop: 10 }}>
        If you see this text, React is mounting correctly.
      </Text>
    </View>
  );
};

export default TestSimple;