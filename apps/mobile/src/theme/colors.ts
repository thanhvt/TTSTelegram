/**
 * Theme Colors - Định nghĩa bảng màu cho app
 *
 * @description 4 bảng màu: Ocean Calm (mặc định), Midnight Audio, Fintech Trust, Terminal Green
 * @returns Object chứa các theme với primary, background, surface, text colors
 */

export type ThemeType = 'ocean-calm' | 'midnight-audio' | 'fintech-trust' | 'terminal-green';

export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  accent: string;
  error: string;
  success: string;
  border: string;
}

/**
 * Định nghĩa các bảng màu
 * - Ocean Calm: Màu teal, nền navy - theme mặc định
 * - Midnight Audio: Màu tím, nền indigo đậm
 * - Fintech Trust: Màu xanh dương, nền sáng
 * - Terminal Green: Màu xanh lá, nền đen
 */
export const themes: Record<ThemeType, ThemeColors> = {
  'ocean-calm': {
    primary: '#0D9488',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceHover: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    accent: '#14B8A6',
    error: '#EF4444',
    success: '#22C55E',
    border: '#334155',
  },
  'midnight-audio': {
    primary: '#8B5CF6',
    background: '#1E1B4B',
    surface: '#312E81',
    surfaceHover: '#3730A3',
    text: '#F8FAFC',
    textSecondary: '#A5B4FC',
    accent: '#A78BFA',
    error: '#F87171',
    success: '#4ADE80',
    border: '#4338CA',
  },
  'fintech-trust': {
    primary: '#3B82F6',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceHover: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#64748B',
    accent: '#60A5FA',
    error: '#DC2626',
    success: '#16A34A',
    border: '#E2E8F0',
  },
  'terminal-green': {
    primary: '#22C55E',
    background: '#0A0A0A',
    surface: '#171717',
    surfaceHover: '#262626',
    text: '#F0FDF4',
    textSecondary: '#86EFAC',
    accent: '#4ADE80',
    error: '#EF4444',
    success: '#22C55E',
    border: '#27272A',
  },
};

// Theme mặc định
export const DEFAULT_THEME: ThemeType = 'ocean-calm';
