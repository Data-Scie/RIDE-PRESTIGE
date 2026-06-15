import { Text } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ROSE_GOLD, MUTED, LINE, CARD } from '@/constants/theme';

export default function DriverLayout() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (user.role === 'affiliate') return <Redirect href="/(affiliate)" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: CARD,
          borderTopColor: LINE,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: ROSE_GOLD,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }}
      />
      <Tabs.Screen
        name="available-jobs"
        options={{ title: 'Jobs', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text> }}
      />
      <Tabs.Screen
        name="my-jobs"
        options={{ title: 'My Jobs', tabBarIcon: () => <Text style={{ fontSize: 20 }}>✅</Text> }}
      />
      <Tabs.Screen
        name="current-ride"
        options={{ title: 'Ride', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🚗</Text> }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ title: 'Earnings', tabBarIcon: () => <Text style={{ fontSize: 20 }}>💷</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
    </Tabs>
  );
}
