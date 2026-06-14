import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { CARD, LINE, TEXT, MUTED, ROSE_GOLD, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export function FormInput({ label, error, required, style, ...props }: FormInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : undefined, style]}
        placeholderTextColor={MUTED}
        selectionColor={ROSE_GOLD}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: MUTED,
    marginBottom: 6,
    fontFamily: FONT_MEDIUM ?? undefined,
  },
  required: { color: '#E53935' },
  input: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: TEXT,
    fontSize: 15,
    fontFamily: FONT_REGULAR ?? undefined,
  },
  inputError: { borderColor: '#E53935' },
  error: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
    fontFamily: FONT_REGULAR ?? undefined,
  },
});
