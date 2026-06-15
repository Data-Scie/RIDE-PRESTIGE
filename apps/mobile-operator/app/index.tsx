import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { BLACK, ROSE_GOLD } from '@/constants/theme';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={ROSE_GOLD} size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (user.role === 'affiliate') return <Redirect href="/(affiliate)" />;
  return <Redirect href="/(driver)" />;
}
