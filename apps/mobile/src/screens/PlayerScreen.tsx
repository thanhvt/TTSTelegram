/**
 * Player Screen - Màn hình player modal với controls
 *
 * @description Full-screen player với now playing, controls, progress bar
 * @navigation Mở như modal từ Groups screen
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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

      {/* Now Playing Info */}
      <View style={styles.nowPlaying}>
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
      </View>

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
