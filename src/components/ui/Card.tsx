/**
 * Enhanced Card Component
 */

import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows, animation } from '../../theme/designTokens';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  style?: any;
  hoverable?: boolean;
}

export const Card = React.forwardRef<Animated.View, CardProps>({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
  hoverable = false,
}, ref) => {
  const bgAnim = React.useRef(new Animated.Value(0)).current;
  const shadowAnim = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (hoverable && !onPress) {
      Animated.timing(bgAnim, { toValue: 1, duration: animation.durations.fast, useNativeDriver: false }).start();
      Animated.timing(shadowAnim, { toValue: 1, duration: animation.durations.fast, useNativeDriver: false }).start();
    }
  };

  const handlePressOut = () => {
    if (hoverable && !onPress) {
      Animated.timing(bgAnim, { toValue: 0, duration: animation.durations.normal, useNativeDriver: false }).start();
      Animated.timing(shadowAnim, { toValue: 0, duration: animation.durations.normal, useNativeDriver: false }).start();
    }
  };

  const variants = {
    default: { bg: colors.bgElevated, border: 'transparent' },
    elevated: { bg: colors.bgElevated, border: 'transparent' },
    outlined: { bg: 'transparent', border: colors.border },
    gradient: { bg: colors.bgElevated, border: 'transparent' },
  };

  const paddings = { none: 0, sm: spacing.sm, md: spacing.md, lg: spacing.lg };
  
  const v = variants[variant];
  const p = paddings[padding];

  const animatedStyle = {
    backgroundColor: bgAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [v.bg, colors.bgHover],
    }),
    shadowOpacity: shadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] }),
    shadowRadius: shadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }),
    elevation: shadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
  };

  return (
    <Animated.View ref={ref} style={[styles.container, animatedStyle, { padding: p, borderRadius: borderRadius.xl, ...style }]}>
      {onPress ? (
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={{ borderRadius: borderRadius.xl, ...(variant === 'outlined' ? { borderWidth: 1, borderColor: v.border } : {}) }}
        >
          {children}
        </TouchableOpacity>
      ) : (
        <View style={{ borderRadius: borderRadius.xl, ...(variant === 'outlined' ? { borderWidth: 1, borderColor: v.border } : {}) }}>
          {children}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { 
    borderWidth: 0,
  },
});

Card.displayName = 'Card';
