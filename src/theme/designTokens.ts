/**
 * Design Tokens - Orchestra Design System
 */

export const colors = {
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  primaryLight: '#eef2ff',
  primaryDark: '#3730a3',
  success: '#10b981',
  successLight: '#ecfdf5',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  error: '#ef4444',
  errorLight: '#fef2f2',
  info: '#3b82f6',
  infoLight: '#eff6ff',
  bg: '#0f0f0f',
  bgElevated: '#1a1a1a',
  bgHover: '#262626',
  border: '#2e2e2e',
  borderHover: '#404040',
  textPrimary: '#fafafa',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  textInverse: '#0f0f0f',
  agent: {
    coder: '#3b82f6',
    reviewer: '#10b981',
    terminal: '#6b7280',
    architect: '#f97316',
    debugger: '#a855f7',
    documenter: '#06b6d4',
    tester: '#8b5cf6',
    analyst: '#84cc16',
    researcher: '#ec4899',
    coordinator: '#f59e0b',
  },
  priority: {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#3b82f6',
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const borderRadius = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 };
export const typography = {
  fontSizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36, '4xl': 48 },
  fontWeights: { normal: '400', medium: '500', semibold: '600', bold: '700' },
  lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
};
export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 4px 6px rgba(0,0,0,0.4)',
  lg: '0 10px 15px rgba(0,0,0,0.5)',
  xl: '0 20px 25px rgba(0,0,0,0.6)',
  glow: (color: string) => `0 0 20px ${color}40`,
};
export const animation = {
  durations: { fast: 150, normal: 250, slow: 350 },
  easings: { easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)', easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)', spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
};
