/**
 * Settings Screen - Màn hình cài đặt
 *
 * @description Quản lý voice, playback speed, theme, và logout
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore, TTSProvider } from '../stores/appStore';
import { authStore } from '../stores/authStore';
import { ThemeType, themes } from '../theme';
import { spacing, borderRadius, touchTarget, typography } from '../theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const {
    ttsProvider,
    selectedVoice,
    playbackRate,
    theme: currentTheme,
    setTtsProvider,
    setPlaybackRate,
    setTheme,
    setAuthStatus,
  } = useAppStore();

  /**
   * Xử lý đăng xuất
   */
  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await authStore.clearSession();
            setAuthStatus('disconnected');
          },
        },
      ]
    );
  };

  // Theme options
  const themeOptions: { key: ThemeType; label: string }[] = [
    { key: 'ocean-calm', label: '🌊 Ocean Calm' },
    { key: 'midnight-audio', label: '🌙 Midnight Audio' },
    { key: 'fintech-trust', label: '💎 Fintech Trust' },
    { key: 'terminal-green', label: '💚 Terminal Green' },
  ];

  // Speed options
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cài đặt</Text>
      </View>

      {/* Voice Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          🔊 GIỌNG ĐỌC
        </Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Provider</Text>
            <Text style={[styles.value, { color: theme.textSecondary }]}>
              {ttsProvider === 'google' ? 'Google (Miễn phí)' : ttsProvider}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Voice</Text>
            <Text style={[styles.value, { color: theme.textSecondary }]}>
              {selectedVoice}
            </Text>
          </View>
        </View>
      </View>

      {/* Playback Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          🎵 TỐC ĐỘ PHÁT
        </Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.speedOptions}>
            {speedOptions.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedOption,
                  {
                    backgroundColor:
                      playbackRate === speed ? theme.primary : theme.surfaceHover,
                  },
                ]}
                onPress={() => setPlaybackRate(speed)}
              >
                <Text
                  style={[
                    styles.speedText,
                    { color: playbackRate === speed ? '#fff' : theme.text },
                  ]}
                >
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Theme Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          🎨 GIAO DIỆN
        </Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {themeOptions.map((option, index) => (
            <React.Fragment key={option.key}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => setTheme(option.key)}
              >
                <Text style={[styles.label, { color: theme.text }]}>
                  {option.label}
                </Text>
                {currentTheme === option.key && (
                  <Text style={{ color: theme.primary }}>✓</Text>
                )}
              </TouchableOpacity>
              {index < themeOptions.length - 1 && (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          👤 TÀI KHOẢN
        </Text>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.surface }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: theme.error }]}>
            🚪 Đăng xuất
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['4xl'],
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.h2,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touchTarget.min,
  },
  label: {
    ...typography.body,
  },
  value: {
    ...typography.body,
  },
  divider: {
    height: 1,
    marginLeft: spacing.lg,
  },
  speedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  speedOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  speedText: {
    ...typography.body,
    fontWeight: '600',
  },
  logoutButton: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    ...typography.button,
  },
});
