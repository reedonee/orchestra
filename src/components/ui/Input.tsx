/**
 * Enhanced Input Component
 */

import React from 'react';
import { View, TextInput, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography, animation } from '../../theme/designTokens';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  secureTextEntry?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: any;
  onFocus?: () => void;
  onBlur?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'visible-password';
}

export const Input = React.forwardRef<TextInput, InputProps>({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  helperText,
  secureTextEntry = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  onFocus,
  onBlur,
  autoCapitalize = 'none',
  keyboardType = 'default',
}, ref) => {
  const focusAnim = React.useRef(new Animated.Value(0)).current;
  const errorAnim = React.useRef(new Animated.Value(0)).current;
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (focused) {
      Animated.timing(focusAnim, { toValue: 1, duration: animation.durations.fast, useNativeDriver: false }).start();
    } else {
      Animated.timing(focusAnim, { toValue: 0, duration: animation.durations.normal, useNativeDriver: false }).start();
    }
  }, [focused]);

  React.useEffect(() => {
    if (error) {
      Animated.timing(errorAnim, { toValue: 1, duration: animation.durations.fast, useNativeDriver: false }).start();
    } else {
      Animated.timing(errorAnim, { toValue: 0, duration: animation.durations.normal, useNativeDriver: false }).start();
    }
  }, [error]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : colors.border, error ? colors.error : colors.primary],
  });

  const borderWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const labelColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textMuted, error ? colors.error : colors.primary],
  });

  const labelTranslateY = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  const labelScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Animated.Text style={[
          styles.label,
          { color: labelColor, transform: [{ translateY: labelTranslateY }, { scale: labelScale }] }
        ]}>
        {label}
      )}
      <Animated.View style={[
        styles.inputWrapper,
        { borderColor, borderWidth, borderRadius: borderRadius.lg }
      ]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder && !focused && !value ? placeholder : ''}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          disabled={disabled}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          style={[
            styles.input,
            { color: colors.textPrimary, fontSize: typography.fontSizes.md, fontWeight: typography.fontWeights.normal }
          ]}
        />
        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </Animated.View>
      {(error || helperText) && (
        <Animated.Text style={[
          styles.helperText,
          { color: error ? colors.error : colors.textMuted, opacity: errorAnim }
        ]}>
        {error || helperText}
      </Animated.Text>)
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { 
    position: 'absolute', 
    left: spacing.md, 
    top: spacing.sm, 
    fontSize: typography.fontSizes.md, 
    fontWeight: typography.fontWeights.medium,
    pointerEvents: 'none',
    transformOrigin: '0 0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  icon: { marginHorizontal: spacing.xs },
  input: { flex: 1, height: '100%' },
  helperText: { fontSize: typography.fontSizes.xs, marginLeft: spacing.xs },
});

Input.displayName = 'Input';
