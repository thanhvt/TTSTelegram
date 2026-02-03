/**
 * Settings Screen - Màn hình cài đặt với animations vui nhộn
 *
 * @description Quản lý voice, playback speed, theme, và logout
 * Bao gồm: micro-interactions, confetti, animated icons, theme preview, wave animation
 */

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useTheme } from '../hooks/useTheme';
import { useAppStore, TTSProvider } from '../stores/appStore';
import { useVoices, Voice } from '../hooks/useVoices';
import { authStore } from '../stores/authStore';
import { ThemeType, themes } from '../theme';
import { spacing, borderRadius, touchTarget, typography } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// CONFETTI COMPONENT - Hiệu ứng pháo hoa khi đổi theme
// ============================================
interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
}

const ConfettiAnimation = ({ 
  isActive, 
  onComplete 
}: { 
  isActive: boolean; 
  onComplete: () => void;
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  
  useEffect(() => {
    if (isActive) {
      // Tạo 20 mảnh confetti với màu sắc random
      const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA'];
      const newPieces: ConfettiPiece[] = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 300,
        rotation: Math.random() * 360,
      }));
      setPieces(newPieces);
      
      // Reset sau 1.5s
      setTimeout(() => {
        setPieces([]);
        onComplete();
      }, 1500);
    }
  }, [isActive, onComplete]);
  
  if (!isActive || pieces.length === 0) return null;
  
  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPieceComponent key={piece.id} piece={piece} />
      ))}
    </View>
  );
};

/**
 * Component từng mảnh confetti
 */
const ConfettiPieceComponent = ({ piece }: { piece: ConfettiPiece }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);
  
  useEffect(() => {
    // Scale xuất hiện
    scale.value = withDelay(piece.delay, withSpring(1, { damping: 8 }));
    
    // Rơi xuống với random sway
    translateY.value = withDelay(
      piece.delay,
      withTiming(500, { duration: 1200, easing: Easing.out(Easing.quad) })
    );
    
    // Swing left-right
    translateX.value = withDelay(
      piece.delay,
      withRepeat(
        withSequence(
          withTiming(20, { duration: 200 }),
          withTiming(-20, { duration: 200 })
        ),
        -1,
        true
      )
    );
    
    // Xoay liên tục
    rotate.value = withDelay(
      piece.delay,
      withRepeat(withTiming(360, { duration: 800 }), -1)
    );
    
    // Fade out ở cuối
    opacity.value = withDelay(1000, withTiming(0, { duration: 500 }));
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        { 
          left: piece.x, 
          backgroundColor: piece.color,
          transform: [{ rotate: `${piece.rotation}deg` }],
        },
        animatedStyle,
      ]}
    />
  );
};

// ============================================
// ANIMATED BUTTON - Hiệu ứng bounce khi nhấn
// ============================================
interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  activeOpacity?: number;
  disabled?: boolean;
}

const AnimatedPressable = ({ 
  children, 
  onPress, 
  style, 
  activeOpacity = 0.7,
  disabled = false,
}: AnimatedPressableProps) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={activeOpacity}
        disabled={disabled}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================
// ANIMATED EMOJI - Emoji xoay/bounce
// ============================================
const AnimatedEmoji = ({ emoji, isActive }: { emoji: string; isActive?: boolean }) => {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    if (isActive) {
      // Bounce animation khi active
      scale.value = withSequence(
        withSpring(1.3, { damping: 5 }),
        withSpring(1, { damping: 8 })
      );
      rotate.value = withSequence(
        withTiming(-15, { duration: 100 }),
        withTiming(15, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    }
  }, [isActive]);
  
  // Idle wobble animation
  useEffect(() => {
    rotate.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));
  
  return (
    <Animated.Text style={[styles.animatedEmoji, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
};

// ============================================
// THEME CHIP - Compact chip với color dot
// ============================================
interface ThemeChipProps {
  themeKey: ThemeType;
  isSelected: boolean;
  onPress: () => void;
  emoji: string;
  label: string;
  themeColors: typeof themes;
  currentThemeColors: typeof themes['ocean-calm'];
}

const ThemeChip = ({ 
  themeKey, 
  isSelected, 
  onPress, 
  emoji,
  label,
  themeColors,
  currentThemeColors,
}: ThemeChipProps) => {
  const colors = themeColors[themeKey];
  const scale = useSharedValue(1);
  
  useEffect(() => {
    if (isSelected) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
    }
  }, [isSelected]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <AnimatedPressable onPress={onPress}>
      <Animated.View 
        style={[
          styles.themeChip,
          { 
            backgroundColor: isSelected ? colors.primary : currentThemeColors.surfaceHover,
            borderColor: isSelected ? colors.primary : 'transparent',
          },
          animatedStyle,
        ]}
      >
        {/* Color dot */}
        <View style={[styles.colorDot, { backgroundColor: colors.primary }]}>
          <View style={[styles.colorDotInner, { backgroundColor: colors.accent }]} />
        </View>
        <Text 
          style={[
            styles.themeChipText, 
            { color: isSelected ? '#fff' : currentThemeColors.text }
          ]}
        >
          {emoji} {label}
        </Text>
        {isSelected && (
          <Text style={styles.themeChipCheck}>✓</Text>
        )}
      </Animated.View>
    </AnimatedPressable>
  );
};

// ============================================
// WAVE ANIMATION - Hiệu ứng sóng cho speed
// ============================================
const WaveAnimation = ({ isActive, color }: { isActive: boolean; color: string }) => {
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  const wave3 = useSharedValue(0);
  
  useEffect(() => {
    if (isActive) {
      // Tạo wave effect
      wave1.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1,
        true
      );
      wave2.value = withDelay(
        100,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0.3, { duration: 300 })
          ),
          -1,
          true
        )
      );
      wave3.value = withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0.3, { duration: 300 })
          ),
          -1,
          true
        )
      );
    } else {
      wave1.value = withTiming(0.5);
      wave2.value = withTiming(0.5);
      wave3.value = withTiming(0.5);
    }
  }, [isActive]);
  
  const bar1Style = useAnimatedStyle(() => ({
    height: interpolate(wave1.value, [0, 1], [8, 20]),
    backgroundColor: color,
  }));
  
  const bar2Style = useAnimatedStyle(() => ({
    height: interpolate(wave2.value, [0, 1], [8, 20]),
    backgroundColor: color,
  }));
  
  const bar3Style = useAnimatedStyle(() => ({
    height: interpolate(wave3.value, [0, 1], [8, 20]),
    backgroundColor: color,
  }));
  
  return (
    <View style={styles.waveContainer}>
      <Animated.View style={[styles.waveBar, bar1Style]} />
      <Animated.View style={[styles.waveBar, bar2Style]} />
      <Animated.View style={[styles.waveBar, bar3Style]} />
    </View>
  );
};

// ============================================
// SPEED OPTION - Button tốc độ với wave
// ============================================
interface SpeedOptionProps {
  speed: number;
  isSelected: boolean;
  onPress: () => void;
  primaryColor: string;
  surfaceColor: string;
  textColor: string;
}

const SpeedOption = ({ 
  speed, 
  isSelected, 
  onPress,
  primaryColor,
  surfaceColor,
  textColor,
}: SpeedOptionProps) => {
  const scale = useSharedValue(1);
  
  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.15, { damping: 5, stiffness: 400 }),
      withSpring(1, { damping: 8 })
    );
    onPress();
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <AnimatedPressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.speedOption,
          { backgroundColor: isSelected ? primaryColor : surfaceColor },
          animatedStyle,
        ]}
      >
        <WaveAnimation isActive={isSelected} color={isSelected ? '#fff' : primaryColor} />
        <Text style={[styles.speedText, { color: isSelected ? '#fff' : textColor }]}>
          {speed}x
        </Text>
      </Animated.View>
    </AnimatedPressable>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
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

  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);

  // Bottom Sheet refs
  const voiceSheetRef = useRef<BottomSheet>(null);
  const providerSheetRef = useRef<BottomSheet>(null);

  // Bottom Sheet snap points - FIX: Tăng chiều cao Provider popup
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const providerSnapPoints = useMemo(() => ['55%'], []); // Tăng từ 40% lên 55%

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
   * Xử lý đổi theme với confetti
   */
  const handleThemeChange = (newTheme: ThemeType) => {
    if (newTheme !== currentTheme) {
      setTheme(newTheme);
      setShowConfetti(true);
    }
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

  // Theme options với emoji
  const themeOptions: { key: ThemeType; label: string; emoji: string }[] = [
    { key: 'ocean-calm', label: 'Ocean Calm', emoji: '🌊' },
    { key: 'midnight-audio', label: 'Midnight', emoji: '🌙' },
    { key: 'fintech-trust', label: 'Fintech', emoji: '💎' },
    { key: 'terminal-green', label: 'Terminal', emoji: '💚' },
    { key: 'candy-pop', label: 'Candy Pop', emoji: '🍬' },
    { key: 'sunset-vibes', label: 'Sunset', emoji: '🌅' },
    { key: 'neon-cyberpunk', label: 'Cyberpunk', emoji: '🎮' },
  ];

  // Speed options
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    // FIX: Đổi từ ScrollView sang View để tránh VirtualizedLists warning
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Confetti Effect */}
      <ConfettiAnimation 
        isActive={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <AnimatedEmoji emoji="⚙️" />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Cài đặt</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Voice Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AnimatedEmoji emoji="🔊" />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              GIỌNG ĐỌC
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            {/* Provider Selection */}
            <AnimatedPressable
              onPress={() => providerSheetRef.current?.expand()}
              style={styles.row}
            >
              <Text style={[styles.label, { color: theme.text }]}>Provider</Text>
              <View style={styles.valueRow}>
                <Text style={[styles.value, { color: theme.textSecondary }]}>
                  {getProviderDisplayName()}
                </Text>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </View>
            </AnimatedPressable>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Voice Selection */}
            <AnimatedPressable
              onPress={() => !randomVoice && voiceSheetRef.current?.expand()}
              style={[styles.row, randomVoice && styles.disabledRow]}
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
            </AnimatedPressable>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Random Voice Toggle */}
            <View style={styles.row}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.label, { color: theme.text }]}>Giọng ngẫu nhiên</Text>
                <Text style={[styles.hint, { color: theme.textSecondary }]}>
                  Mỗi tin nhắn một giọng khác
                </Text>
              </View>
              <AnimatedPressable
                onPress={() => setRandomVoice(!randomVoice)}
                style={[
                  styles.toggle,
                  { backgroundColor: randomVoice ? theme.primary : theme.surfaceHover }
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    randomVoice && styles.toggleThumbActive
                  ]}
                />
              </AnimatedPressable>
            </View>
          </View>
        </View>

        {/* Playback Section với Wave Animation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AnimatedEmoji emoji="🎵" />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              TỐC ĐỘ PHÁT
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.speedOptions}>
              {speedOptions.map((speed) => (
                <SpeedOption
                  key={speed}
                  speed={speed}
                  isSelected={playbackRate === speed}
                  onPress={() => setPlaybackRate(speed)}
                  primaryColor={theme.primary}
                  surfaceColor={theme.surfaceHover}
                  textColor={theme.text}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Theme Section - Horizontal Chips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AnimatedEmoji emoji="🎨" />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              GIAO DIỆN
            </Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themeChipsContainer}
          >
            {themeOptions.map((option) => (
              <ThemeChip
                key={option.key}
                themeKey={option.key}
                isSelected={currentTheme === option.key}
                onPress={() => handleThemeChange(option.key)}
                emoji={option.emoji}
                label={option.label}
                themeColors={themes}
                currentThemeColors={theme}
              />
            ))}
          </ScrollView>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AnimatedEmoji emoji="👤" />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              TÀI KHOẢN
            </Text>
          </View>
          <AnimatedPressable
            style={[styles.logoutButton, { backgroundColor: theme.surface }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: theme.error }]}>
              🚪 Đăng xuất
            </Text>
          </AnimatedPressable>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

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
              <AnimatedPressable
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
              </AnimatedPressable>
            )}
            ItemSeparatorComponent={() => (
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            )}
            contentContainerStyle={styles.sheetListContent}
          />
        )}
      </BottomSheet>

      {/* Provider Picker Bottom Sheet - FIX: Tăng chiều cao */}
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
          <AnimatedPressable
            style={[
              styles.providerItem,
              ttsProvider === 'google' && { backgroundColor: theme.surfaceHover }
            ]}
            onPress={() => handleProviderChange('google')}
          >
            <AnimatedEmoji emoji="🔊" isActive={ttsProvider === 'google'} />
            <View style={styles.providerInfo}>
              <Text style={[styles.providerName, { color: theme.text }]}>Google</Text>
              <Text style={[styles.providerDesc, { color: theme.textSecondary }]}>
                Miễn phí • Ổn định
              </Text>
            </View>
            {ttsProvider === 'google' && (
              <Text style={{ color: theme.primary, fontSize: 20 }}>✓</Text>
            )}
          </AnimatedPressable>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Google Cloud */}
          <AnimatedPressable
            style={[
              styles.providerItem,
              !googleCloudAvailable && styles.providerDisabled,
              ttsProvider === 'google-cloud' && { backgroundColor: theme.surfaceHover }
            ]}
            onPress={() => handleProviderChange('google-cloud')}
          >
            <AnimatedEmoji emoji="☁️" isActive={ttsProvider === 'google-cloud'} />
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
          </AnimatedPressable>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* OpenAI */}
          <AnimatedPressable
            style={[
              styles.providerItem,
              !openaiAvailable && styles.providerDisabled,
              ttsProvider === 'openai' && { backgroundColor: theme.surfaceHover }
            ]}
            onPress={() => handleProviderChange('openai')}
          >
            <AnimatedEmoji emoji="✨" isActive={ttsProvider === 'openai'} />
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
          </AnimatedPressable>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
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
  // Speed options với wave animation
  speedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  speedOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: 70,
  },
  speedText: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  // Wave animation
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    height: 20,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
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
  // Theme chip styles - Compact horizontal chips
  themeChipsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeChipText: {
    ...typography.caption,
    fontWeight: '600',
  },
  themeChipCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  // Legacy theme styles (kept for reference)
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  themeLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Provider picker styles
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touchTarget.comfortable,
  },
  providerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
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
  // Confetti styles
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  // Animated emoji
  animatedEmoji: {
    fontSize: 20,
  },
});
