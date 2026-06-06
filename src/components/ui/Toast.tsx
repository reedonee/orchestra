/**
 * Toast/Notification System
 */

import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows, animation } from '../../theme/designTokens';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, type = 'info', onClose, duration = 4000 }: ToastProps) => {
  const translateY = React.useRef(new Animated.Value(50)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const progress = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: animation.durations.normal, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: animation.durations.fast, useNativeDriver: true }),
    ]).start();

    Animated.timing(progress, {
      toValue: 0,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      dismiss();
    });

    return () => {
      Animated.timing(translateY, { toValue: -50, duration: animation.durations.fast, useNativeDriver: true }).start();
    };
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -50, duration: animation.durations.fast, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: animation.durations.fast, useNativeDriver: true }),
    ]).start(onClose);
  };

  const types = {
    success: { bg: colors.success, text: '#fff', icon: '✓' },
    error: { bg: colors.error, text: '#fff', icon: '✕' },
    warning: { bg: colors.warning, text: '#1a1a1a', icon: '⚠' },
    info: { bg: colors.primary, text: '#fff', icon: 'ℹ' },
  };

  const t = types[type];

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity, backgroundColor: t.bg, ...shadows.lg }]}>
      <View style={styles.content}>
        <Text style={{ color: t.text, fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold }}>{t.icon}</Text>
        <Text style={{ color: t.text, fontSize: typography.fontSizes.md, fontWeight: typography.fontWeights.medium, flex: 1 }}>{message}</Text>
        <TouchableOpacity onPress={dismiss} style={styles.close}>
          <Text style={{ color: t.text, fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold }}>✕</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={[styles.progressBar, { backgroundColor: t.text }]}>
        <Animated.View style={[styles.progressFill, { width: progress, backgroundColor: t.text }]} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 300,
    overflow: 'hidden',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  close: { padding: spacing.xs },
  progressBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
  progressFill: { height: '100%' },
});

Toast.displayName = 'Toast';
