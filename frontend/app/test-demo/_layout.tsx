import { Stack } from 'expo-router';

export default function TestDemoLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="investor-profile" 
        options={{ 
          title: "Investor Demo Profile",
          headerShown: false,
        }} 
      />
    </Stack>
  );
}