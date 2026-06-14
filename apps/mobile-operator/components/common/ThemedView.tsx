import { View, type ViewProps } from 'react-native';
import { BLACK, CARD } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  variant?: 'screen' | 'card';
};

export function ThemedView({ style, variant = 'screen', ...rest }: ThemedViewProps) {
  return (
    <View
      style={[{ backgroundColor: variant === 'card' ? CARD : BLACK }, style]}
      {...rest}
    />
  );
}
