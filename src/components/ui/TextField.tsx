import React, { useState } from 'react';
import { TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { fonts, fontSize, minTouch, radius, useTheme } from '@/theme';
import { Text } from './Text';

type Props = {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  rows?: number;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string | null;
  editable?: boolean;
  onSubmitEditing?: () => void;
};

export function TextField({ label, value, onChangeText, placeholder, secureTextEntry, multiline, rows = 4, keyboardType, autoCapitalize = 'none', error, editable = true, onSubmitEditing }: Props) {
  const { colors } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text variant="label" color="muted">{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={editable}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={label}
        style={{
          minHeight: multiline ? rows * 23 + 28 : 48,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          textAlignVertical: multiline ? 'top' : 'center',
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? colors.bad : focus ? colors.accent : colors.line,
          backgroundColor: editable ? colors.card : colors.fill,
          color: colors.text,
          fontFamily: fonts.body,
          fontSize: fontSize.md,
          // web only: remove the default focus outline, the border color already shows focus
          ...({ outlineStyle: 'none' } as object),
        }}
      />
      {error ? <Text variant="small" color="bad">{error}</Text> : null}
    </View>
  );
}
