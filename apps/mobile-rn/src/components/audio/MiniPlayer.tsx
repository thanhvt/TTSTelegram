/**
 * Mini Player Component - Thanh player nhỏ nằm dưới tab bar
 *
 * @description Hiển thị now playing và controls ở dưới màn hình
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { RootStackParamList } from '../../navigation/types';
import { spacing, borderRadius, touchTarget, typography } from '../../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * MiniPlayer Component
 *
 * @description Thanh player mini nằm trên tab bar
 * - Hiển thị khi có item trong queue
 * - Tap để mở full Player screen
 * - Play/Pause button
 */
export function MiniPlayer() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const {
    currentItem,
    isPlaying,
    isBuffering,
    isGenerating,
    position,
    duration,
    togglePlayPause,
  } = useAudioPlayer();

  // Không hiện nếu không có item
  if (!currentItem) {
    return null;
  }

  // Progress percentage
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      {/* Progress bar */}
      <View style={[styles.progress, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: theme.primary, width: `${progressPercent}%` },
          ]}
        />
      </View>

      <TouchableOpacity
        style={styles.content}
        onPress={() => navigation.navigate('Player')}
        activeOpacity={0.7}
      >
        {/* Now playing info */}
        <View style={styles.info}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {currentItem.dialogTitle}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {currentItem.message.text}
          </Text>
        </View>

        {/* Play/Pause button */}
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: theme.primary }]}
          onPress={togglePlayPause}
        >
          <Text style={styles.playIcon}>
            {isGenerating || isBuffering ? '⏳' : isPlaying ? '⏸️' : '▶️'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 85, // Trên tab bar
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  progress: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    ...typography.label,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.caption,
  },
  playButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: touchTarget.min / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 18,
  },
});
