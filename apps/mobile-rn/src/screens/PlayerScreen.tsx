/**
 * Player Screen - Màn hình player modal với controls
 *
 * @description Full-screen player với now playing, controls, progress bar, swipe gestures
 * @navigation Mở như modal từ Groups screen
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { RootStackParamList } from '../navigation/types';
import { spacing, borderRadius, touchTarget, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Format seconds thành mm:ss
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Lấy chữ cái đầu tiên của tên group cho fallback avatar
 */
function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function PlayerScreen({ navigation }: Props) {
  const theme = useTheme();
  const {
    isPlaying,
    isBuffering,
    isGenerating,
    currentItem,
    position,
    duration,
    currentIndex,
    queueLength,
    togglePlayPause,
    skipNext,
    skipPrevious,
    play,
    isReady,
  } = useAudioPlayer();

  // Ref để track đã auto-start chưa (tránh gọi nhiều lần)
  const hasAutoStarted = useRef(false);

  // Auto-start: Tự động phát khi mở màn hình
  useEffect(() => {
    if (isReady && currentItem && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      console.log('Auto-start: Bắt đầu phát tự động...');
      play();
    }
  }, [isReady, currentItem, play]);

  // Progress percentage
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  // F30: Swipe gesture handling
  const translateX = useSharedValue(0);
  const SWIPE_THRESHOLD = 100;

  // Callbacks cho gesture (phải dùng runOnJS vì là JS function)
  const handleSwipeLeft = useCallback(() => {
    if (currentIndex < queueLength - 1) {
      skipNext();
    }
  }, [currentIndex, queueLength, skipNext]);

  const handleSwipeRight = useCallback(() => {
    if (currentIndex > 0) {
      skipPrevious();
    }
  }, [currentIndex, skipPrevious]);

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left → Skip Next
        runOnJS(handleSwipeLeft)();
      } else if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right → Skip Previous
        runOnJS(handleSwipeRight)();
      }
      // Snap back với spring animation
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
    });

  // Animated style cho swipe feedback
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.3 }],
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header với nút close */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.closeText, { color: theme.textSecondary }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.queueInfo, { color: theme.textSecondary }]}>
          {currentIndex + 1} / {queueLength}
        </Text>
      </View>

      {/* Now Playing Info - Swipeable */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.nowPlaying, animatedStyle]}>
          {/* Avatar: Logo group hoặc fallback initials */}
          <View style={[styles.avatarContainer, { backgroundColor: theme.surface }]}>
            {currentItem?.dialogPhotoUrl ? (
              <Image
                source={{ uri: currentItem.dialogPhotoUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.avatarInitials, { color: theme.primary }]}>
                {currentItem?.dialogTitle ? getInitials(currentItem.dialogTitle) : '🎧'}
              </Text>
            )}
          </View>

          {/* Group name */}
          <Text style={[styles.groupName, { color: theme.text }]}>
            {currentItem?.dialogTitle || 'Đang chờ...'}
          </Text>

          {/* Message text - Full content với ScrollView */}
          <ScrollView 
            style={styles.messageScrollView}
            contentContainerStyle={styles.messageScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.messageText, { color: theme.textSecondary }]}>
              {currentItem?.message.text || 'Chọn group và bấm "Bắt đầu đọc"'}
            </Text>
          </ScrollView>

          {/* Sender info */}
          {currentItem?.message.senderName && (
            <Text style={[styles.senderInfo, { color: theme.textSecondary }]}>
              👤 {currentItem.message.senderName}
            </Text>
          )}

          {/* Swipe hint */}
          <Text style={[styles.swipeHint, { color: theme.textSecondary }]}>
            ⬅️ Vuốt để chuyển track ➡️
          </Text>
        </Animated.View>
      </GestureDetector>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: theme.surface }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.primary, width: `${progressPercent}%` },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {formatTime(position)}
          </Text>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Controls - Redesigned với UI/UX Pro Max */}
      <View style={styles.controls}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { 
              backgroundColor: theme.surface,
              borderColor: currentIndex === 0 ? 'transparent' : 'rgba(255,255,255,0.15)',
            },
          ]}
          onPress={skipPrevious}
          disabled={currentIndex === 0}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Text style={[styles.controlIcon, { opacity: currentIndex === 0 ? 0.3 : 1 }]}>
            ⏮
          </Text>
        </TouchableOpacity>

        {/* Play/Pause Button - Chính với glow effect */}
        <TouchableOpacity
          style={[
            styles.playButton,
            { 
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
            },
          ]}
          onPress={togglePlayPause}
          activeOpacity={0.8}
        >
          {isGenerating || isBuffering ? (
            <Text style={styles.playIcon}>⏳</Text>
          ) : (
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          )}
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { 
              backgroundColor: theme.surface,
              borderColor: currentIndex >= queueLength - 1 ? 'transparent' : 'rgba(255,255,255,0.15)',
            },
          ]}
          onPress={skipNext}
          disabled={currentIndex >= queueLength - 1}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.controlIcon,
              { opacity: currentIndex >= queueLength - 1 ? 0.3 : 1 },
            ]}
          >
            ⏭
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status indicator */}
      {(isGenerating || isBuffering) && (
        <Text style={[styles.statusText, { color: theme.accent }]}>
          {isGenerating ? 'Đang tạo audio...' : 'Đang tải...'}
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    fontWeight: '300',
  },
  queueInfo: {
    ...typography.body,
  },
  nowPlaying: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  // Avatar styles - cải thiện với border và shadow
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: '700',
  },
  groupName: {
    ...typography.h3,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  // Message styles - Full content với ScrollView
  messageScrollView: {
    maxHeight: 150,
    width: '100%',
    marginBottom: spacing.md,
  },
  messageScrollContent: {
    paddingHorizontal: spacing.sm,
  },
  messageText: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  senderInfo: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  swipeHint: {
    ...typography.caption,
    marginTop: spacing.lg,
    opacity: 0.6,
  },
  progressContainer: {
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timeText: {
    ...typography.caption,
  },
  // Controls - Redesigned theo UI/UX Pro Max
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  controlIcon: {
    fontSize: 22,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    // Glow effect
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playIcon: {
    fontSize: 28,
  },
  statusText: {
    ...typography.bodySmall,
    textAlign: 'center',
    paddingBottom: spacing.lg,
  },
});
