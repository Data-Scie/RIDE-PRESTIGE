import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FONT_MEDIUM, TEXT, ROSE_GOLD, MUTED } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: MUTED,
    fontFamily: FONT_MEDIUM ?? undefined,
  },
  action: {
    fontSize: 13,
    color: ROSE_GOLD,
    fontWeight: '600',
    fontFamily: FONT_MEDIUM ?? undefined,
  },
});
