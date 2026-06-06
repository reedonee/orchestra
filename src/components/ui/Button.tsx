/**
 * Enhanced Button Component
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows, animation } from '../../theme/designTokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: any;
}

export const Button = React.forwardRef<Animated.View, ButtonProps>({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
}, ref) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  const variants = {
    primary: {
      bg: colors.primary,
      text: colors.textInverse,
      border: 'transparent',
      hoverBg: colors.primaryHover,
    },
    secondary: {
      bg: colors.bgElevated,
      text: colors.textPrimary,
      border: colors.border,
      hoverBg: colors.bgHover,
    },
    ghost: {
      bg: 'transparent',
      text: colors.primary,
      border: 'transparent',
      hoverBg: colors.primaryLight + '20',
    },
    danger: {
      bg: colors.error,
      text: '#fff',
      border: 'transparent',
      hoverBg: '#dc2626',
    },
  };

  const sizes = {
    sm: { px: spacing.md, py: spacing.xs, fontSize: typography.fontSizes.sm, gap: spacing.xs },
    md: { px: spacing.lg, py: spacing.sm, fontSize: typography.fontSizes.md, gap: spacing.sm },
    lg: { px: spacing.xl, py: spacing.md, fontSize: typography.fontSizes.lg, gap: spacing.md },
  };

  const v = variants[variant];
  const s = sizes[size];

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  return (
    <Animated.View ref={ref} style={[styles.container, { width: fullWidth ? '100%' : 'auto' }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={loading || disabled ? undefined : onPress}
        disabled={disabled || loading}
        activeOpacity={disabled || loading ? 1 : 1}
        style={[
          styles.button,
          {
            backgroundColor: disabled ? colors.border : v.bg,
            borderColor: v.border,
            paddingHorizontal: s.px,
            paddingVertical: s.py,
            borderRadius: borderRadius.lg,
            ...(!disabled && !loading && { shadowColor: v.bg, ...shadows.md }),
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.gap }}>
          {loading ? (
            <Animated.View style={styles.spinner}>
              <Animated.Text style={styles.spinnerText}>&bull;</Animated.Text>
            </Animated.View>
          ) : leftIcon ? (
            <View>{leftIcon}</View>
          ) : null}
          <Text style={[
            styles.text,
            { color: disabled ? colors.textMuted : v.text, fontSize: s.fontSize, fontWeight: typography.fontWeights.semibold }
          ]}>
            {title}
          </Text>
          {rightIcon && !loading && <View>{rightIcon}</View>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 88 },
  text: { textAlign: 'center' },
  spinner: { width: 16, height: 16 },
  spinnerText: { fontSize: 24, lineHeight: 16, color: '#fff' },
});

Button.displayName = 'Button';
