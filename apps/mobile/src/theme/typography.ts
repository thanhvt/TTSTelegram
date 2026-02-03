/**
 * Typography - Định nghĩa font sizes và styles
 *
 * @description Tuân theo React Native sizing và accessibility guidelines
 * @returns Object chứa các text styles chuẩn
 */

import { TextStyle } from 'react-native';

// Font sizes (sp) - Tuân theo Material Design guidelines
export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

// Font weights
export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Line heights
export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// Định nghĩa text styles chuẩn
export const typography: Record<string, TextStyle> = {
  // Headings
  h1: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
  },
  h2: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
  },
  h3: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xl * lineHeights.tight,
  },

  // Body
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },

  // Labels
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.tight,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },

  // Buttons
  button: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.base * lineHeights.tight,
  },
  buttonSmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.sm * lineHeights.tight,
  },
};
