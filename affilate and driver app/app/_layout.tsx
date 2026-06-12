import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#030303' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(affiliate)" />
          <Stack.Screen name="(driver)" />
          <Stack.Screen name="job-details" options={{ headerShown: true, title: 'Job Details', headerStyle: { backgroundColor: '#090A09' }, headerTintColor: '#D7B46A' }} />
          <Stack.Screen name="allocate-driver" options={{ headerShown: true, title: 'Allocate Driver', headerStyle: { backgroundColor: '#090A09' }, headerTintColor: '#D7B46A' }} />
          <Stack.Screen name="allocate-vehicle" options={{ headerShown: true, title: 'Allocate Vehicle', headerStyle: { backgroundColor: '#090A09' }, headerTintColor: '#D7B46A' }} />
          <Stack.Screen name="add-driver" options={{ headerShown: true, title: 'Add Driver', headerStyle: { backgroundColor: '#090A09' }, headerTintColor: '#D7B46A' }} />
          <Stack.Screen name="driver-details" options={{ headerShown: true, title: 'Driver Details', headerStyle: { backgroundColor: '#090A09' }, headerTintColor: '#D7B46A' }} />
          <Stack.Screen name="add-vehicle" options={{ headerShown: true, title: 'Add Vehicle', headerStyle: { backgroundColor: '#090A09' }, headerTintColor: '#D7B46A' }} />
          <Stack.Screen name="vehicle-details" options={{ headerShown: true, title: 'Vehicle Details', headerStyle: { backgroundColor: '#090A09' }, headerTintColor: '#D7B46A' }} />
          <Stack.Screen name="ride-history" options={{ headerShown: true, title: 'Ride History', headerStyle: { backgroundColor: '#090A09' }, headerTintColor: '#D7B46A' }} />
          <Stack.Screen name="documents" options={{ headerShown: true, title: 'Documents', headerStyle: { backgroundColor: '#090A09' }, headerTintColor: '#D7B46A' }} />
          <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications', headerStyle: { backgroundColor: '#090A09' }, headerTintColor: '#D7B46A' }} />
          <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings', headerStyle: { backgroundColor: '#090A09' }, headerTintColor: '#D7B46A' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AuthProvider>
  );
}
