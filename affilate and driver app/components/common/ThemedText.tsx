import { StyleSheet, Text, type TextProps } from 'react-native';
import { FONT_MEDIUM, FONT_REGULAR, TEXT, ROSE_GOLD, MUTED } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'muted' | 'gold';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  return (
    <Text
      style={[
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'muted' ? styles.muted : undefined,
        type === 'gold' ? styles.gold : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    color: TEXT,
    fontFamily: FONT_REGULAR ?? undefined,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: TEXT,
    fontFamily: FONT_MEDIUM ?? undefined,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
    color: TEXT,
    fontFamily: FONT_MEDIUM ?? undefined,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT,
    fontFamily: FONT_MEDIUM ?? undefined,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    color: ROSE_GOLD,
    fontFamily: FONT_MEDIUM ?? undefined,
  },
  muted: {
    fontSize: 13,
    color: MUTED,
    fontFamily: FONT_REGULAR ?? undefined,
  },
  gold: {
    fontSize: 16,
    fontWeight: '600',
    color: ROSE_GOLD,
    fontFamily: FONT_MEDIUM ?? undefined,
  },
});
