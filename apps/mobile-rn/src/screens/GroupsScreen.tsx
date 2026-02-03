/**
 * Groups Screen - Màn hình danh sách groups/channels
 *
 * @description Hiển thị và chọn groups để đọc tin nhắn
 * @features Tìm kiếm, lọc theo Groups/Channels, hiển thị logo group
 * @flow Load dialogs → User lọc/tìm → Chọn groups → Bấm "Bắt đầu đọc" → Load messages → Navigate to Player
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { useQueue } from '../hooks/useQueue';
import { useAppStore, TelegramDialog, SortBy } from '../stores/appStore';
import { dialogsApi } from '../services/api';
import { RootStackParamList } from '../navigation/types';
import { spacing, borderRadius, touchTarget, typography } from '../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Loại filter: tất cả, chỉ groups, chỉ channels
type FilterType = 'all' | 'group' | 'channel';

/**
 * Dialog Item Component - Memoized để tối ưu FlatList
 * @param dialog - Dialog data bao gồm photoUrl
 * @param isSelected - Có đang được chọn hay không
 * @param onToggle - Callback khi toggle selection
 * @description Card có avatar/logo thực từ Telegram API
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
    // Icon type emoji làm fallback khi không có logo
    const typeEmoji = dialog.type === 'channel' ? '📢' : '👥';
    const typeLabel = dialog.type === 'channel' ? 'Channel' : dialog.type === 'megagroup' ? 'Supergroup' : 'Group';

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

        {/* Avatar/Logo của group */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: dialog.type === 'channel' ? '#9C27B0' + '30' : theme.primary + '30',
            },
          ]}
        >
          {dialog.photoUrl ? (
            <Image
              source={{ uri: dialog.photoUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarEmoji}>{typeEmoji}</Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.dialogContent}>
          <View style={styles.dialogHeader}>
            <Text style={[styles.dialogTitle, { color: theme.text }]} numberOfLines={1}>
              {dialog.title}
            </Text>
            {dialog.unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <Text style={styles.badgeText}>
                  {dialog.unreadCount > 999 ? '999+' : dialog.unreadCount}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.dialogSubtitle}>
            <Text style={[styles.typeLabel, { color: theme.textSecondary }]}>
              {typeLabel}
            </Text>
            {dialog.lastMessage && (
              <Text
                style={[styles.lastMessage, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                • {dialog.lastMessage}
              </Text>
            )}
          </View>
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
    sortBy,
    setDialogs,
    toggleDialogSelection,
    selectAllDialogs,
    deselectAllDialogs,
    setSortBy,
    getSortedDialogs,
  } = useAppStore();

  const { loadMessagesFromGroups, isLoading: isLoadingMessages } = useQueue();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // State cho tìm kiếm và lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  /**
   * Load dialogs từ API
   */
  const loadDialogs = useCallback(async () => {
    try {
      console.log('[GroupsScreen] Đang gọi API getDialogs...');
      const data = await dialogsApi.getDialogs();
      console.log('[GroupsScreen] API trả về:', data?.length ?? 0, 'dialogs');
      setDialogs(data);
    } catch (error) {
      console.error('[GroupsScreen] Lỗi load dialogs:', error);
      Alert.alert(
        'Lỗi tải dữ liệu',
        error instanceof Error ? error.message : 'Không thể tải danh sách groups. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
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

  // Lấy danh sách đã sắp xếp
  const sortedDialogs = getSortedDialogs();

  /**
   * Lọc danh sách theo search query và filter type
   * @description Bước 1: Filter user type, Bước 2: Filter theo type, Bước 3: Filter theo search
   */
  const filteredDialogs = useMemo(() => {
    // Bước 1: Loại bỏ Chat cá nhân (user type)
    let filtered = sortedDialogs.filter((d) => d.type !== 'user');

    // Bước 2: Filter theo type được chọn
    if (filterType === 'group') {
      filtered = filtered.filter((d) => d.type === 'group' || d.type === 'megagroup');
    } else if (filterType === 'channel') {
      filtered = filtered.filter((d) => d.type === 'channel');
    }

    // Bước 3: Filter theo search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((d) => d.title.toLowerCase().includes(query));
    }

    return filtered;
  }, [sortedDialogs, filterType, searchQuery]);

  /**
   * Đếm số lượng theo type để hiển thị trên filter tabs
   */
  const typeCounts = useMemo(() => {
    const groupsAndChannels = dialogs.filter((d) => d.type !== 'user');
    return {
      all: groupsAndChannels.length,
      group: groupsAndChannels.filter((d) => d.type === 'group' || d.type === 'megagroup').length,
      channel: groupsAndChannels.filter((d) => d.type === 'channel').length,
    };
  }, [dialogs]);

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

      {/* Search Bar - Tìm kiếm group */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Tìm kiếm group..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearButton, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs - Lọc theo Groups/Channels */}
      <View style={[styles.filterRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {[
          { key: 'all' as FilterType, label: 'Tất cả', count: typeCounts.all },
          { key: 'group' as FilterType, label: 'Groups', count: typeCounts.group },
          { key: 'channel' as FilterType, label: 'Channels', count: typeCounts.channel },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterOption,
              filterType === tab.key && { backgroundColor: theme.primary },
            ]}
            onPress={() => setFilterType(tab.key)}
          >
            <Text
              style={[
                styles.filterOptionText,
                { color: filterType === tab.key ? '#fff' : theme.text },
              ]}
            >
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Select All Control */}
      <View style={[styles.selectAllRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={selectedDialogIds.length === filteredDialogs.length ? deselectAllDialogs : selectAllDialogs}
        >
          <Text style={[styles.selectAllText, { color: theme.primary }]}>
            {selectedDialogIds.length === filteredDialogs.length ? '☐ Bỏ chọn tất cả' : '☑ Chọn tất cả'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.selectedCount, { color: theme.textSecondary }]}>
          {selectedDialogIds.length}/{filteredDialogs.length}
        </Text>
      </View>

      {/* Sort Picker */}
      <View style={[styles.sortRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>Sắp xếp:</Text>
        <TouchableOpacity
          style={[
            styles.sortOption,
            sortBy === 'time' && { backgroundColor: theme.primary },
          ]}
          onPress={() => setSortBy('time')}
        >
          <Text style={[
            styles.sortOptionText,
            { color: sortBy === 'time' ? '#fff' : theme.text },
          ]}>
            🕒 Mới nhất
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortOption,
            sortBy === 'unread' && { backgroundColor: theme.primary },
          ]}
          onPress={() => setSortBy('unread')}
        >
          <Text style={[
            styles.sortOptionText,
            { color: sortBy === 'unread' ? '#fff' : theme.text },
          ]}>
            📨 Chưa đọc
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dialog List */}
      <FlatList
        data={filteredDialogs}
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
          length: 80,
          offset: 80 * index,
          index,
        })}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery ? 'Không tìm thấy kết quả' : 'Không có groups nào'}
            </Text>
          </View>
        }
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
  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    fontSize: 16,
    padding: spacing.sm,
  },
  // Filter Tabs Styles
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  filterOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  filterOptionText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  // Select All Styles
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
  // Sort Row Styles
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  sortLabel: {
    ...typography.bodySmall,
    marginRight: spacing.sm,
  },
  sortOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  sortOptionText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  // List Styles
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
  },
  // Dialog Item Styles
  dialogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 80,
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
  // Avatar/Logo Styles
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  // Dialog Content Styles
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
  dialogSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeLabel: {
    ...typography.caption,
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
    flex: 1,
  },
  // Floating Button Styles
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
