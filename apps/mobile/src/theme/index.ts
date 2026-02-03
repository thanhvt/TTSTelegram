/**
 * Theme Index - Export tất cả theme utilities
 *
 * @description Re-export colors, typography và theme hook
 */

export * from './colors';
export * from './typography';

// Spacing scale (dp)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// Touch target sizes (minimum 48dp theo Material Design)
export const touchTarget = {
  min: 48,
  comfortable: 56,
  large: 64,
} as const;
