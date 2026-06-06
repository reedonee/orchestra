/**
 * Badge Component - For agent types, priorities, status
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography, animation } from '../../theme/designTokens';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'agent' | 'priority' | 'status' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  animated?: boolean;
  style?: any;
}

export const Badge = ({ children, variant = 'default', size = 'md', dot = false, animated = false, style }: BadgeProps) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    if (animated && variant !== 'default') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [animated, variant]);

  const variants: Record<string, { bg: string; text: string; border: string }> = {
    default: { bg: colors.border, text: colors.textSecondary, border: 'transparent' },
    agent: { bg: colors.primary + '20', text: colors.primary, border: colors.primary + '40' },
    priority: { bg: colors.warning + '20', text: colors.warning, border: colors.warning + '40' },
    status: { bg: colors.info + '20', text: colors.info, border: colors.info + '40' },
    success: { bg: colors.success + '20', text: colors.success, border: colors.success + '40' },
    warning: { bg: colors.warning + '20', text: colors.warning, border: colors.warning + '40' },
    error: { bg: colors.error + '20', text: colors.error, border: colors.error + '40' },
    info: { bg: colors.info + '20', text: colors.info, border: colors.info + '40' },
  };

  const sizes = {
    sm: { px: spacing.sm, py: spacing.xs, fontSize: typography.fontSizes.xs, gap: spacing.xs, dotSize: 6 },
    md: { px: spacing.md, py: spacing.xs, fontSize: typography.fontSizes.sm, gap: spacing.xs, dotSize: 8 },
    lg: { px: spacing.lg, py: spacing.sm, fontSize: typography.fontSizes.md, gap: spacing.sm, dotSize: 10 },
  };

  const v = variants[variant] || variants.default;
  const s = sizes[size];

  const dotStyle = animated ? { opacity: pulseAnim } : {};

  return (
    <View style={[
      styles.container,
      { backgroundColor: v.bg, borderColor: v.border, paddingHorizontal: s.px, paddingVertical: s.py, borderRadius: borderRadius.full, ...style }
    ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.gap }}>
        {dot && (
          <Animated.View style={[styles.dot, { width: s.dotSize, height: s.dotSize, backgroundColor: v.text, ...dotStyle }]} />
        )}
        <Text style={{ color: v.text, fontSize: s.fontSize, fontWeight: typography.fontWeights.semibold, lineHeight: s.fontSize * 1.3 }}>
          {children}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  dot: { borderRadius: 9999 },
});

Badge.displayName = 'Badge';
