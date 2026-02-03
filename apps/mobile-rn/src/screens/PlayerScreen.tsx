/**
 * Player Screen - Màn hình player modal với controls
 *
 * @description Full-screen player với now playing, controls, progress bar, swipe gestures
 * @navigation Mở như modal từ Groups screen
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
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
    seekTo,
  } = useAudioPlayer();

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
          {/* Avatar placeholder */}
          <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
            <Text style={styles.avatarEmoji}>🎧</Text>
          </View>

          {/* Group name */}
          <Text style={[styles.groupName, { color: theme.text }]}>
            {currentItem?.dialogTitle || 'Đang chờ...'}
          </Text>

          {/* Message text */}
          <Text
            style={[styles.messageText, { color: theme.textSecondary }]}
            numberOfLines={4}
          >
            {currentItem?.message.text || 'Chọn group và bấm "Bắt đầu đọc"'}
          </Text>

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

      {/* Controls */}
      <View style={styles.controls}>
        {/* Previous */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.surface }]}
          onPress={skipPrevious}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.controlIcon, { opacity: currentIndex === 0 ? 0.5 : 1 }]}>
            ⏮️
          </Text>
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: theme.primary }]}
          onPress={togglePlayPause}
        >
          {isGenerating || isBuffering ? (
            <Text style={styles.playIcon}>⏳</Text>
          ) : (
            <Text style={styles.playIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
          )}
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.surface }]}
          onPress={skipNext}
          disabled={currentIndex >= queueLength - 1}
        >
          <Text
            style={[
              styles.controlIcon,
              { opacity: currentIndex >= queueLength - 1 ? 0.5 : 1 },
            ]}
          >
            ⏭️
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
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
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  groupName: {
    ...typography.h3,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  messageText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  senderInfo: {
    ...typography.caption,
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
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  controlButton: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    borderRadius: touchTarget.comfortable / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 24,
  },
  playButton: {
    width: touchTarget.large + 8,
    height: touchTarget.large + 8,
    borderRadius: (touchTarget.large + 8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 32,
  },
  statusText: {
    ...typography.bodySmall,
    textAlign: 'center',
    paddingBottom: spacing.lg,
  },
});
