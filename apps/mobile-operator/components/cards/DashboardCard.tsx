import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CARD, LINE, TEXT, MUTED, ROSE_GOLD, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

interface DashboardCardProps {
  label: string;
  value: string | number;
  icon: string;
  accent?: boolean;
  onPress?: () => void;
}

export function DashboardCard({ label, value, icon, accent = false, onPress }: DashboardCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, accent && styles.cardAccent]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    padding: 16,
    minWidth: 130,
    gap: 6,
  },
  cardAccent: {
    borderColor: 'rgba(215,180,106,0.4)',
    backgroundColor: 'rgba(215,180,106,0.06)',
  },
  icon: { fontSize: 24 },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT,
    fontFamily: FONT_MEDIUM ?? undefined,
  },
  valueAccent: { color: ROSE_GOLD },
  label: {
    fontSize: 12,
    color: MUTED,
    fontFamily: FONT_REGULAR ?? undefined,
  },
});
