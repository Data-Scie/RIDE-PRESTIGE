import { Text } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ROSE_GOLD, MUTED, LINE, CARD } from '@/constants/theme';

export default function AffiliateLayout() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (user.role !== 'affiliate') return <Redirect href="/(driver)" />;

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
        name="new-jobs"
        options={{ title: 'New Jobs', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text> }}
      />
      <Tabs.Screen
        name="accepted-jobs"
        options={{ title: 'Accepted', tabBarIcon: () => <Text style={{ fontSize: 20 }}>✅</Text> }}
      />
      <Tabs.Screen
        name="drivers"
        options={{ title: 'Drivers', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{ title: 'Vehicles', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🚗</Text> }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ title: 'Earnings', tabBarIcon: () => <Text style={{ fontSize: 20 }}>💷</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text> }}
      />
    </Tabs>
  );
}
