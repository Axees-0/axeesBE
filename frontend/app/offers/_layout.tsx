import { Stack } from 'expo-router';

export default function OffersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="premade" />
      <Stack.Screen name="details" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="success" />
      <Stack.Screen name="custom" />
    </Stack>
  );
}