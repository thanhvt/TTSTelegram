/**
 * Theme Config - Định nghĩa các bảng màu cho ứng dụng
 * 
 * @description Chứa 4 bảng màu: Midnight Audio, Fintech Trust, Terminal Green, Ocean Calm
 * @usage Import và sử dụng với useTheme hook
 */

import type { ThemeType } from '../stores/appStore';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceLight: string;
  text: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  description: string;
  colors: ThemeColors;
}

/**
 * Danh sách các theme có sẵn
 */
export const THEMES: Record<ThemeType, ThemeConfig> = {
  'midnight-audio': {
    id: 'midnight-audio',
    name: 'Midnight Audio',
    description: 'Phong cách Spotify/Apple Music - thư giãn khi nghe lâu',
    colors: {
      primary: '#8B5CF6',
      primaryLight: '#A78BFA',
      secondary: '#C084FC',
      accent: '#22D3EE',
      background: '#121212',
      surface: '#1E1E1E',
      surfaceLight: '#2A2A2A',
      text: '#FAFAFA',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  'fintech-trust': {
    id: 'fintech-trust',
    name: 'Fintech Trust',
    description: 'Tone vàng cam ấm áp - chuyên nghiệp và đáng tin',
    colors: {
      primary: '#F59E0B',
      primaryLight: '#FBBF24',
      secondary: '#FCD34D',
      accent: '#8B5CF6',
      background: '#0F172A',
      surface: '#1E293B',
      surfaceLight: '#334155',
      text: '#F8FAFC',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  'terminal-green': {
    id: 'terminal-green',
    name: 'Terminal Green',
    description: 'Phong cách developer/hacker - cá tính Matrix',
    colors: {
      primary: '#00FF41',
      primaryLight: '#39FF14',
      secondary: '#008F11',
      accent: '#FF3333',
      background: '#0D1117',
      surface: '#161B22',
      surfaceLight: '#21262D',
      text: '#E6EDF3',
      success: '#00FF41',
      warning: '#FFFF00',
      error: '#FF3333',
    },
  },
  'ocean-calm': {
    id: 'ocean-calm',
    name: 'Ocean Calm',
    description: 'Tone biển thư giãn - dễ chịu cho mắt',
    colors: {
      primary: '#0EA5E9',
      primaryLight: '#38BDF8',
      secondary: '#7DD3FC',
      accent: '#F97316',
      background: '#0C1222',
      surface: '#1A2744',
      surfaceLight: '#2D3F5F',
      text: '#F0F9FF',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

/**
 * Apply theme vào CSS variables
 * 
 * @description Cập nhật CSS custom properties trên document root
 * @param themeId - ID của theme cần apply
 */
export function applyTheme(themeId: ThemeType): void {
  const theme = THEMES[themeId];
  if (!theme) {
    console.warn(`Theme "${themeId}" không tồn tại, sử dụng ocean-calm`);
    return applyTheme('ocean-calm');
  }

  const root = document.documentElement;
  const { colors } = theme;

  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-light', colors.primaryLight);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-surface', colors.surface);
  root.style.setProperty('--color-surface-light', colors.surfaceLight);
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-error', colors.error);

  console.log(`🎨 Theme đã áp dụng: ${theme.name}`);
}

/**
 * Lấy danh sách themes dưới dạng array để render
 */
export function getThemeList(): ThemeConfig[] {
  return Object.values(THEMES);
}
