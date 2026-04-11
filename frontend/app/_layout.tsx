import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="origami/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="video" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="subscription" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}
