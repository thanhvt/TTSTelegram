/**
 * GroupSelector - Component chọn groups để đọc
 *
 * @description Hiển thị danh sách groups/channels với checkbox
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Users,
  Radio,
  User,
  CheckSquare,
  Square,
  Loader2,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import { dialogsApi } from '../lib/api';
import { useAppStore, TelegramDialog } from '../stores/appStore';

// Kiểu sắp xếp: theo thời gian hoặc số tin nhắn chưa đọc
type SortOption = 'time' | 'unread';

const TYPE_ICONS = {
  group: Users,
  megagroup: Users,
  channel: Radio,
  user: User,
};

const TYPE_LABELS = {
  group: 'Group',
  megagroup: 'Supergroup',
  channel: 'Channel',
  user: 'Chat',
};

export function GroupSelector() {
  const {
    dialogs,
    setDialogs,
    selectedDialogIds,
    toggleDialogSelection,
    selectAllDialogs,
    deselectAllDialogs,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('time');

  /**
   * Fetch danh sách dialogs từ API
   */
  const fetchDialogs = async () => {
    setIsLoading(true);
    try {
      const data = await dialogsApi.getDialogs(100);
      setDialogs(
        data.map((d) => ({
          ...d,
          lastMessageDate: d.lastMessageDate ? new Date(d.lastMessageDate) : undefined,
        }))
      );
    } catch (error) {
      console.error('Lỗi fetch dialogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dialogs khi mount
  useEffect(() => {
    if (dialogs.length === 0) {
      fetchDialogs();
    }
  }, []);

  /**
   * Lọc danh sách chỉ giữ lại Groups và Channels có tin nhắn chưa đọc
   * - Loại bỏ Chat cá nhân (user type)
   * - Loại bỏ những bản ghi không có tin nhắn mới
   * - Áp dụng filter theo type, search và sắp xếp
   */
  const filteredDialogs = useMemo(() => {
    // Bước 1: Loại bỏ Chat cá nhân (user type), giữ lại:
    // - Những bản ghi có tin nhắn mới (unreadCount > 0)
    // - HOẶC những bản ghi đang được selected (để user không mất track)
    const groupsAndChannels = dialogs.filter(
      (d) => d.type !== 'user' && (d.unreadCount > 0 || selectedDialogIds.includes(d.id))
    );
    
    // Bước 2: Filter theo type được chọn
    let filtered = groupsAndChannels.filter((d) => {
      // Filter theo type (group bao gồm cả megagroup)
      if (filterType === 'group' && d.type !== 'group' && d.type !== 'megagroup') {
        return false;
      }
      if (filterType === 'channel' && d.type !== 'channel') {
        return false;
      }
      // Filter theo search
      if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
    
    // Bước 3: Sắp xếp theo option được chọn
    return filtered.sort((a, b) => {
      if (sortBy === 'unread') {
        // Sắp xếp theo số tin nhắn chưa đọc (nhiều -> ít)
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      } else {
        // Sắp xếp theo thời gian (mới nhất -> cũ nhất)
        const dateA = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
        const dateB = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
        return dateB - dateA;
      }
    });
  }, [dialogs, filterType, searchQuery, sortBy, selectedDialogIds]);

  /**
   * Đếm số lượng theo type (chỉ đếm Groups và Channels có tin nhắn mới)
   */
  const typeCounts = useMemo(() => {
    // Chỉ đếm Groups và Channels có tin nhắn mới (loại bỏ user type và unreadCount = 0)
    const groupsAndChannels = dialogs.filter(
      (d) => d.type !== 'user' && d.unreadCount > 0
    );
    return {
      all: groupsAndChannels.length,
      group: groupsAndChannels.filter((d) => d.type === 'group' || d.type === 'megagroup').length,
      channel: groupsAndChannels.filter((d) => d.type === 'channel').length,
    };
  }, [dialogs]);

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Chọn Groups</h2>
        <button
          onClick={fetchDialogs}
          disabled={isLoading}
          className="btn-ghost p-2"
          title="Làm mới"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm group..."
          className="input pl-10"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'Tất cả', count: typeCounts.all },
          { key: 'group', label: 'Groups', count: typeCounts.group },
          { key: 'channel', label: 'Channels', count: typeCounts.channel },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === tab.key
                ? 'bg-primary text-white'
                : 'bg-surface-light text-gray-400 hover:text-white'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Sắp xếp theo */}
      <div className="flex items-center gap-2 mb-4">
        <ArrowUpDown className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-400">Sắp xếp:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-surface-light border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-primary focus:border-primary cursor-pointer"
        >
          <option value="time">Thời gian</option>
          <option value="unread">Số tin chưa đọc</option>
        </select>
      </div>

      {/* Select all / Deselect all */}
      <div className="flex gap-2 mb-3">
        <button onClick={selectAllDialogs} className="btn-ghost text-sm py-1">
          <CheckSquare className="w-4 h-4 mr-1" />
          Chọn tất cả
        </button>
        <button onClick={deselectAllDialogs} className="btn-ghost text-sm py-1">
          <Square className="w-4 h-4 mr-1" />
          Bỏ chọn
        </button>
        <span className="text-sm text-gray-500 ml-auto">
          Đã chọn: {selectedDialogIds.length}
        </span>
      </div>

      {/* Dialog list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredDialogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'Không tìm thấy kết quả' : 'Không có groups nào'}
          </div>
        ) : (
          filteredDialogs.map((dialog) => (
            <DialogItem
              key={dialog.id}
              dialog={dialog}
              isSelected={selectedDialogIds.includes(dialog.id)}
              onToggle={() => toggleDialogSelection(dialog.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * DialogItem - Hiển thị một dialog với animation badge
 * @param dialog - Dialog data
 * @param isSelected - Có đang được chọn hay không
 * @param onToggle - Callback khi toggle selection
 * @description Animation pulse sẽ chạy khi unreadCount giảm
 */
function DialogItem({
  dialog,
  isSelected,
  onToggle,
}: {
  dialog: TelegramDialog;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const Icon = TYPE_ICONS[dialog.type] || User;
  const prevUnreadRef = useRef(dialog.unreadCount);
  const [isAnimating, setIsAnimating] = useState(false);

  // Detect khi unreadCount giảm để trigger animation
  useEffect(() => {
    if (dialog.unreadCount < prevUnreadRef.current) {
      // Số đã giảm, trigger animation
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
    prevUnreadRef.current = dialog.unreadCount;
  }, [dialog.unreadCount]);

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 text-left ${
        isSelected
          ? 'bg-primary/20 border border-primary/50'
          : 'bg-surface-light/50 hover:bg-surface-light border border-transparent'
      } ${dialog.unreadCount === 0 ? 'opacity-60' : ''}`}
    >
      {/* Checkbox - Tăng kích thước từ 20px lên 24px để dễ tap hơn trên mobile */}
      <div
        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
          isSelected ? 'bg-primary border-primary' : 'border-gray-400 hover:border-gray-300'
        }`}
      >
        {isSelected && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          dialog.type === 'channel' ? 'bg-secondary/20' : 'bg-primary/20'
        }`}
      >
        <Icon className={`w-5 h-5 ${dialog.type === 'channel' ? 'text-secondary' : 'text-primary'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{dialog.title}</div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>{TYPE_LABELS[dialog.type]}</span>
          {dialog.unreadCount > 0 ? (
            <span 
              className={`px-2 py-0.5 bg-amber-500 rounded-full text-slate-900 font-semibold text-[11px] transition-transform ${
                isAnimating ? 'animate-pulse scale-110' : ''
              }`}
            >
              {dialog.unreadCount > 999 ? '999+' : dialog.unreadCount} chưa đọc
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-green-500/80 rounded-full text-white font-semibold text-[11px]">
              ✓ Đã đọc hết
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
