import { SafeAreaView, ScrollView, View, StyleSheet, type ViewStyle } from 'react-native';
import { BLACK } from '@/constants/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function ScreenWrapper({
  children,
  scrollable = true,
  style,
  contentStyle,
}: ScreenWrapperProps) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BLACK },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 32 },
});
