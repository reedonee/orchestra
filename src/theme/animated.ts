/**
 * Animated Components - Smooth micro-interactions
 */

import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';

export const fadeIn = (anim: Animated.Value, duration = 250) => {
  anim.setValue(0);
  return Animated.timing(anim, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();
};

export const fadeOut = (anim: Animated.Value, duration = 200) => {
  return Animated.timing(anim, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  }).start();
};

export const slideUp = (anim: Animated.Value, duration = 300) => {
  anim.setValue(20);
  return Animated.timing(anim, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.back(1.2)),
    useNativeDriver: true,
  }).start();
};

export const scaleIn = (anim: Animated.Value, duration = 200) => {
  anim.setValue(0.9);
  return Animated.spring(anim, {
    toValue: 1,
    tension: 300,
    friction: 20,
    useNativeDriver: true,
  }).start();
};

export const pulse = (anim: Animated.Value) => {
  anim.setValue(1);
  return Animated.loop(
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.05, duration: 1000, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(anim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin) }),
    ])
  ).start();
};

export const shimmer = (anim: Animated.Value) => {
  anim.setValue(-1);
  return Animated.loop(
    Animated.timing(anim, {
      toValue: 2,
      duration: 1500,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();
};
