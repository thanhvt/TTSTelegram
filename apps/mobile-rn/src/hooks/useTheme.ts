/**
 * useTheme Hook - Lấy theme colors dựa trên setting
 *
 * @description Hook để lấy current theme colors từ store
 * @returns ThemeColors object
 */

import { useAppStore } from '../stores/appStore';
import { themes, ThemeColors } from '../theme';

/**
 * Hook để lấy current theme colors
 *
 * @returns ThemeColors object với primary, background, text, etc.
 *
 * @example
 * const theme = useTheme();
 * <View style={{ backgroundColor: theme.background }}>
 *   <Text style={{ color: theme.text }}>Hello</Text>
 * </View>
 */
export function useTheme(): ThemeColors {
  const themeName = useAppStore((state) => state.theme);
  return themes[themeName];
}
