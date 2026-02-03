/**
 * Groups Screen - Màn hình danh sách groups/channels
 *
 * @description Hiển thị và chọn groups để đọc tin nhắn
 * @flow Load dialogs → User chọn groups → Bấm "Bắt đầu đọc" → Load messages → Navigate to Player
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { useQueue } from '../hooks/useQueue';
import { useAppStore, TelegramDialog } from '../stores/appStore';
import { dialogsApi } from '../services/api';
import { RootStackParamList } from '../navigation/types';
import { spacing, borderRadius, touchTarget, typography } from '../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Dialog Item Component - Memoized để tối ưu FlatList
 */
const DialogItem = React.memo(
  ({
    dialog,
    isSelected,
    onToggle,
    theme,
  }: {
    dialog: TelegramDialog;
    isSelected: boolean;
    onToggle: () => void;
    theme: ReturnType<typeof useTheme>;
  }) => {
    const typeEmoji = dialog.type === 'channel' ? '📢' : '👥';

    return (
      <TouchableOpacity
        style={[
          styles.dialogItem,
          { backgroundColor: isSelected ? theme.surfaceHover : theme.surface },
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <View
          style={[
            styles.checkbox,
            {
              borderColor: isSelected ? theme.primary : theme.border,
              backgroundColor: isSelected ? theme.primary : 'transparent',
            },
          ]}
        >
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>

        {/* Content */}
        <View style={styles.dialogContent}>
          <View style={styles.dialogHeader}>
            <Text style={[styles.dialogTitle, { color: theme.text }]}>
              {typeEmoji} {dialog.title}
            </Text>
            {dialog.unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <Text style={styles.badgeText}>{dialog.unreadCount}</Text>
              </View>
            )}
          </View>
          {dialog.lastMessage && (
            <Text
              style={[styles.lastMessage, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {dialog.lastMessage}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

export default function GroupsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const {
    dialogs,
    selectedDialogIds,
    setDialogs,
    toggleDialogSelection,
    selectAllDialogs,
    deselectAllDialogs,
  } = useAppStore();

  const { loadMessagesFromGroups, isLoading: isLoadingMessages } = useQueue();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Load dialogs từ API
   */
  const loadDialogs = useCallback(async () => {
    try {
      const data = await dialogsApi.getDialogs();
      setDialogs(data);
    } catch (error) {
      console.error('Lỗi load dialogs:', error);
    }
  }, [setDialogs]);

  // Initial load
  useEffect(() => {
    loadDialogs().finally(() => setIsLoading(false));
  }, [loadDialogs]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDialogs();
    setIsRefreshing(false);
  }, [loadDialogs]);

  /**
   * Xử lý bấm "Bắt đầu đọc"
   */
  const handleStartReading = useCallback(async () => {
    const count = await loadMessagesFromGroups();

    if (count > 0) {
      // Navigate sang Player screen
      navigation.navigate('Player');
    } else {
      Alert.alert('Thông báo', 'Không có tin nhắn nào để đọc');
    }
  }, [loadMessagesFromGroups, navigation]);

  // Render dialog item
  const renderItem = useCallback(
    ({ item }: { item: TelegramDialog }) => (
      <DialogItem
        dialog={item}
        isSelected={selectedDialogIds.includes(item.id)}
        onToggle={() => toggleDialogSelection(item.id)}
        theme={theme}
      />
    ),
    [selectedDialogIds, toggleDialogSelection, theme]
  );

  // Key extractor
  const keyExtractor = useCallback((item: TelegramDialog) => item.id, []);

  // Tính tổng unread của selected groups
  const totalUnread = dialogs
    .filter((d) => selectedDialogIds.includes(d.id))
    .reduce((sum, d) => sum + d.unreadCount, 0);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>TTS Reader</Text>
      </View>

      {/* Select All Control */}
      <View style={[styles.selectAllRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={selectedDialogIds.length === dialogs.length ? deselectAllDialogs : selectAllDialogs}
        >
          <Text style={[styles.selectAllText, { color: theme.primary }]}>
            {selectedDialogIds.length === dialogs.length ? '☐ Bỏ chọn tất cả' : '☑ Chọn tất cả'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.selectedCount, { color: theme.textSecondary }]}>
          {selectedDialogIds.length}/{dialogs.length}
        </Text>
      </View>

      {/* Dialog List */}
      <FlatList
        data={dialogs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        getItemLayout={(_, index) => ({
          length: 72,
          offset: 72 * index,
          index,
        })}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
      />

      {/* Start Reading Button */}
      {selectedDialogIds.length > 0 && (
        <View style={[styles.floatingButton, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: theme.primary },
              isLoadingMessages && styles.startButtonDisabled,
            ]}
            onPress={handleStartReading}
            disabled={isLoadingMessages}
            activeOpacity={0.8}
          >
            {isLoadingMessages ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>
                🎧 Bắt đầu đọc ({totalUnread > 0 ? totalUnread : selectedDialogIds.length * 20} tin nhắn)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  selectAllButton: {
    padding: spacing.sm,
  },
  selectAllText: {
    ...typography.body,
  },
  selectedCount: {
    ...typography.body,
  },
  listContent: {
    paddingBottom: 100,
  },
  dialogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 72,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dialogContent: {
    flex: 1,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dialogTitle: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastMessage: {
    ...typography.bodySmall,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  startButton: {
    height: touchTarget.comfortable,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    ...typography.button,
    color: '#fff',
  },
});
