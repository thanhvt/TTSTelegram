/**
 * Settings Screen - Màn hình cài đặt
 *
 * @description Quản lý voice, playback speed, theme, và logout
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore, TTSProvider } from '../stores/appStore';
import { useVoices, Voice } from '../hooks/useVoices';
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
    setSelectedVoice,
    setPlaybackRate,
    setTheme,
    setAuthStatus,
  } = useAppStore();

  // Voice picker state
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const { voices, isLoading: voicesLoading, getVoicesByProvider } = useVoices();

  // Lấy danh sách voices theo provider hiện tại
  const availableVoices = getVoicesByProvider(ttsProvider);

  /**
   * Xử lý chọn voice
   * @param voice - Voice được chọn
   */
  const handleSelectVoice = (voice: Voice) => {
    setSelectedVoice(voice.id);
    setVoiceModalVisible(false);
  };

  /**
   * Lấy tên hiển thị của voice đang chọn
   */
  const getVoiceDisplayName = (): string => {
    const voice = voices.find((v) => v.id === selectedVoice);
    return voice ? `${voice.name} (${voice.gender === 'Male' ? '♂' : '♀'})` : selectedVoice;
  };

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
          <TouchableOpacity
            style={styles.row}
            onPress={() => setVoiceModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, { color: theme.text }]}>Voice</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: theme.textSecondary }]}>
                {getVoiceDisplayName()}
              </Text>
              <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
            </View>
          </TouchableOpacity>
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

      {/* Voice Picker Modal */}
      <Modal
        visible={voiceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVoiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Chọn giọng đọc</Text>
              <TouchableOpacity
                onPress={() => setVoiceModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {voicesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Đang tải danh sách giọng đọc...
                </Text>
              </View>
            ) : availableVoices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Không có giọng đọc nào cho provider {ttsProvider}
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableVoices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.voiceItem,
                      selectedVoice === item.id && { backgroundColor: theme.surfaceHover }
                    ]}
                    onPress={() => handleSelectVoice(item)}
                  >
                    <View style={styles.voiceInfo}>
                      <Text style={[styles.voiceName, { color: theme.text }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.voiceMeta, { color: theme.textSecondary }]}>
                        {item.gender === 'Male' ? '♂ Nam' : '♀ Nữ'} • {item.provider}
                      </Text>
                    </View>
                    {selectedVoice === item.id && (
                      <Text style={{ color: theme.primary, fontSize: 20 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing['4xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    ...typography.h3,
    fontWeight: '600',
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: 18,
  },
  loadingContainer: {
    padding: spacing['4xl'],
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
  },
  emptyContainer: {
    padding: spacing['4xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  voiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touchTarget.min,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    ...typography.body,
    fontWeight: '500',
  },
  voiceMeta: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
