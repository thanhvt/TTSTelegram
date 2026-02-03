/**
 * Queue Screen - Hiển thị danh sách tin nhắn trong queue
 *
 * @description Hiển thị Now Playing và upcoming messages
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { useAppStore, QueueItem } from '../stores/appStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { RootStackParamList } from '../navigation/types';
import { spacing, borderRadius, touchTarget, typography } from '../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Queue Item Component - Memoized để tối ưu FlatList
 */
const QueueItemRow = React.memo(
  ({
    item,
    index,
    isCurrentItem,
    theme,
  }: {
    item: QueueItem;
    index: number;
    isCurrentItem: boolean;
    theme: ReturnType<typeof useTheme>;
  }) => {
    // Status emoji
    const statusEmoji = {
      pending: '⏳',
      generating: '🔄',
      ready: '✅',
      playing: '🎵',
      completed: '✔️',
      error: '❌',
    }[item.status];

    return (
      <View
        style={[
          styles.queueItem,
          {
            backgroundColor: isCurrentItem ? theme.surfaceHover : theme.surface,
            borderLeftColor: isCurrentItem ? theme.primary : 'transparent',
          },
        ]}
      >
        <View style={styles.queueItemContent}>
          <View style={styles.queueItemHeader}>
            <Text style={[styles.queueItemStatus]}>{statusEmoji}</Text>
            <Text
              style={[styles.queueItemTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {item.dialogTitle}
            </Text>
          </View>
          <Text
            style={[styles.queueItemText, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {item.message.text}
          </Text>
          {item.message.senderName && (
            <Text style={[styles.queueItemSender, { color: theme.textSecondary }]}>
              👤 {item.message.senderName}
            </Text>
          )}
        </View>
      </View>
    );
  }
);

export default function QueueScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { queue, currentQueueIndex } = useAppStore();
  const { isPlaying, currentItem, togglePlayPause } = useAudioPlayer();

  // Separate current, upcoming, and completed
  const upcomingItems = queue.slice(currentQueueIndex + 1);
  const completedItems = queue.slice(0, currentQueueIndex);

  // Render item
  const renderItem = useCallback(
    ({ item, index }: { item: QueueItem; index: number }) => (
      <QueueItemRow
        item={item}
        index={index}
        isCurrentItem={item.id === currentItem?.id}
        theme={theme}
      />
    ),
    [currentItem, theme]
  );

  const keyExtractor = useCallback((item: QueueItem) => item.id, []);

  // Empty state
  if (queue.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Queue</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Queue trống
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Chọn groups và bấm "Bắt đầu đọc" ở tab Groups
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Queue</Text>
        <Text style={[styles.headerCount, { color: theme.textSecondary }]}>
          {queue.length} tin nhắn
        </Text>
      </View>

      {/* Now Playing */}
      {currentItem && (
        <TouchableOpacity
          style={[styles.nowPlaying, { backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate('Player')}
          activeOpacity={0.8}
        >
          <View style={styles.nowPlayingContent}>
            <Text style={[styles.nowPlayingLabel, { color: theme.primary }]}>
              🔊 Đang phát
            </Text>
            <Text
              style={[styles.nowPlayingText, { color: theme.text }]}
              numberOfLines={2}
            >
              {currentItem.message.text}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.miniPlayButton, { backgroundColor: theme.primary }]}
            onPress={togglePlayPause}
          >
            <Text style={styles.miniPlayIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Queue List */}
      <FlatList
        data={upcomingItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        ListHeaderComponent={() =>
          upcomingItems.length > 0 ? (
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              ⏭️ Tiếp theo ({upcomingItems.length})
            </Text>
          ) : null
        }
        ListEmptyComponent={() => (
          <View style={styles.allDone}>
            <Text style={styles.allDoneEmoji}>✅</Text>
            <Text style={[styles.allDoneText, { color: theme.textSecondary }]}>
              Đã phát hết queue
            </Text>
          </View>
        )}
      />
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
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.h2,
  },
  headerCount: {
    ...typography.body,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  nowPlayingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  nowPlayingLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  nowPlayingText: {
    ...typography.body,
  },
  miniPlayButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: touchTarget.min / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPlayIcon: {
    fontSize: 20,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  queueItem: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  queueItemContent: {
    padding: spacing.md,
  },
  queueItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  queueItemStatus: {
    marginRight: spacing.sm,
  },
  queueItemTitle: {
    ...typography.label,
    flex: 1,
  },
  queueItemText: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  queueItemSender: {
    ...typography.caption,
  },
  allDone: {
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  allDoneEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  allDoneText: {
    ...typography.body,
  },
});
