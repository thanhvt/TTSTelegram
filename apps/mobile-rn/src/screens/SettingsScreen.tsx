/**
 * Settings Screen - Màn hình cài đặt
 *
 * @description Quản lý voice, playback speed, theme, và logout
 */

import React, { useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
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
    randomVoice,
    playbackRate,
    theme: currentTheme,
    setTtsProvider,
    setSelectedVoice,
    setRandomVoice,
    setPlaybackRate,
    setTheme,
    setAuthStatus,
  } = useAppStore();

  // Bottom Sheet refs
  const voiceSheetRef = useRef<BottomSheet>(null);
  const providerSheetRef = useRef<BottomSheet>(null);

  // Bottom Sheet snap points (50% và 90% màn hình)
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const providerSnapPoints = useMemo(() => ['40%'], []);

  // Render backdrop với hiệu ứng mờ
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );
  
  // Voices data
  const { 
    voices, 
    isLoading: voicesLoading, 
    getVoicesByProvider,
    openaiAvailable,
    googleCloudAvailable,
  } = useVoices();

  // Lấy danh sách voices theo provider hiện tại
  const availableVoices = getVoicesByProvider(ttsProvider);

  /**
   * Xử lý chọn voice
   * @param voice - Voice được chọn
   */
  const handleSelectVoice = (voice: Voice) => {
    setSelectedVoice(voice.id);
    voiceSheetRef.current?.close();
  };

  /**
   * Xử lý chọn provider
   * @param provider - Provider được chọn
   */
  const handleProviderChange = (provider: TTSProvider) => {
    if (provider === 'openai' && !openaiAvailable) {
      Alert.alert('Không khả dụng', 'OpenAI TTS chưa được cấu hình. Vui lòng thêm OPENAI_API_KEY vào backend.');
      return;
    }
    if (provider === 'google-cloud' && !googleCloudAvailable) {
      Alert.alert('Không khả dụng', 'Google Cloud TTS chưa được cấu hình. Vui lòng thêm GOOGLE_CLOUD_API_KEY vào backend.');
      return;
    }
    setTtsProvider(provider);
    providerSheetRef.current?.close();
  };

  /**
   * Lấy tên hiển thị của provider
   */
  const getProviderDisplayName = (): string => {
    switch (ttsProvider) {
      case 'google':
        return 'Google (Miễn phí)';
      case 'google-cloud':
        return 'Google Cloud';
      case 'openai':
        return 'OpenAI';
      default:
        return ttsProvider;
    }
  };

  /**
   * Lấy tên hiển thị của voice đang chọn
   */
  const getVoiceDisplayName = (): string => {
    if (randomVoice) {
      return '🎲 Ngẫu nhiên';
    }
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
    { key: 'candy-pop', label: '🍬 Candy Pop' },
    { key: 'sunset-vibes', label: '🌅 Sunset Vibes' },
    { key: 'neon-cyberpunk', label: '🎮 Neon Cyberpunk' },
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
          {/* Provider Selection */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => providerSheetRef.current?.expand()}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, { color: theme.text }]}>Provider</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: theme.textSecondary }]}>
                {getProviderDisplayName()}
              </Text>
              <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Voice Selection */}
          <TouchableOpacity
            style={[styles.row, randomVoice && styles.disabledRow]}
            onPress={() => !randomVoice && voiceSheetRef.current?.expand()}
            activeOpacity={randomVoice ? 1 : 0.7}
            disabled={randomVoice}
          >
            <Text style={[styles.label, { color: randomVoice ? theme.textSecondary : theme.text }]}>Voice</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: theme.textSecondary }]}>
                {getVoiceDisplayName()}
              </Text>
              {!randomVoice && (
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Random Voice Toggle */}
          <View style={styles.row}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.label, { color: theme.text }]}>Giọng ngẫu nhiên</Text>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                Mỗi tin nhắn một giọng khác
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                { backgroundColor: randomVoice ? theme.primary : theme.surfaceHover }
              ]}
              onPress={() => setRandomVoice(!randomVoice)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.toggleThumb,
                  randomVoice && styles.toggleThumbActive
                ]}
              />
            </TouchableOpacity>
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

      {/* Voice Picker Bottom Sheet */}
      <BottomSheet
        ref={voiceSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
      >
        <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>Chọn giọng đọc</Text>
          <TouchableOpacity
            onPress={() => voiceSheetRef.current?.close()}
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
          <BottomSheetFlatList
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
            contentContainerStyle={styles.sheetListContent}
          />
        )}
      </BottomSheet>

      {/* Provider Picker Bottom Sheet */}
      <BottomSheet
        ref={providerSheetRef}
        index={-1}
        snapPoints={providerSnapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
      >
        <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>Chọn Provider</Text>
          <TouchableOpacity
            onPress={() => providerSheetRef.current?.close()}
            style={styles.closeButton}
          >
            <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sheetContent}>
          {/* Google Free */}
          <TouchableOpacity
            style={[
              styles.providerItem,
              ttsProvider === 'google' && { backgroundColor: theme.surfaceHover }
            ]}
            onPress={() => handleProviderChange('google')}
          >
            <Text style={styles.providerIcon}>🔊</Text>
            <View style={styles.providerInfo}>
              <Text style={[styles.providerName, { color: theme.text }]}>Google</Text>
              <Text style={[styles.providerDesc, { color: theme.textSecondary }]}>
                Miễn phí • Ổn định
              </Text>
            </View>
            {ttsProvider === 'google' && (
              <Text style={{ color: theme.primary, fontSize: 20 }}>✓</Text>
            )}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Google Cloud */}
          <TouchableOpacity
            style={[
              styles.providerItem,
              !googleCloudAvailable && styles.providerDisabled,
              ttsProvider === 'google-cloud' && { backgroundColor: theme.surfaceHover }
            ]}
            onPress={() => handleProviderChange('google-cloud')}
          >
            <Text style={styles.providerIcon}>☁️</Text>
            <View style={styles.providerInfo}>
              <Text style={[styles.providerName, { color: googleCloudAvailable ? theme.text : theme.textSecondary }]}>
                Google Cloud
              </Text>
              <Text style={[styles.providerDesc, { color: theme.textSecondary }]}>
                Premium • Chất lượng cao
              </Text>
            </View>
            {!googleCloudAvailable ? (
              <Text style={[styles.providerBadge, { backgroundColor: theme.surfaceHover, color: theme.textSecondary }]}>
                API Key
              </Text>
            ) : ttsProvider === 'google-cloud' ? (
              <Text style={{ color: theme.primary, fontSize: 20 }}>✓</Text>
            ) : null}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* OpenAI */}
          <TouchableOpacity
            style={[
              styles.providerItem,
              !openaiAvailable && styles.providerDisabled,
              ttsProvider === 'openai' && { backgroundColor: theme.surfaceHover }
            ]}
            onPress={() => handleProviderChange('openai')}
          >
            <Text style={styles.providerIcon}>✨</Text>
            <View style={styles.providerInfo}>
              <Text style={[styles.providerName, { color: openaiAvailable ? theme.text : theme.textSecondary }]}>
                OpenAI
              </Text>
              <Text style={[styles.providerDesc, { color: theme.textSecondary }]}>
                Đa ngôn ngữ • Tự nhiên
              </Text>
            </View>
            {!openaiAvailable ? (
              <Text style={[styles.providerBadge, { backgroundColor: theme.surfaceHover, color: theme.textSecondary }]}>
                API Key
              </Text>
            ) : ttsProvider === 'openai' ? (
              <Text style={{ color: theme.primary, fontSize: 20 }}>✓</Text>
            ) : null}
          </TouchableOpacity>
        </View>
      </BottomSheet>
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
  // Toggle styles
  disabledRow: {
    opacity: 0.5,
  },
  toggleInfo: {
    flex: 1,
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  // Provider picker styles
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touchTarget.comfortable,
  },
  providerIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    ...typography.body,
    fontWeight: '600',
  },
  providerDesc: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  providerDisabled: {
    opacity: 0.4,
  },
  providerBadge: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  // Bottom Sheet styles
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    ...typography.h3,
    fontWeight: '600',
  },
  sheetContent: {
    paddingBottom: spacing['4xl'],
  },
  sheetListContent: {
    paddingBottom: spacing['4xl'],
  },
});
