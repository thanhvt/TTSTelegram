/**
 * GroupSelector - Component chọn groups để đọc
 *
 * @description Hiển thị danh sách groups/channels với Glassmorphism UI
 * @redesign v2.0 - Glassmorphism + Real Avatars + Better UX
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Users,
  Radio,
  User,
  Loader2,
  RefreshCw,
  ArrowUpDown,
  CheckCheck,
  XCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
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
    isGroupSelectorCollapsed,
    toggleGroupSelectorCollapse,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('time');

  /**
   * Fetch danh sách dialogs từ API
   * @description Lấy tất cả groups/channels kèm theo ảnh đại diện
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
   */
  const filteredDialogs = useMemo(() => {
    // Bước 1: Loại bỏ Chat cá nhân (user type)
    const groupsAndChannels = dialogs.filter(
      (d) => d.type !== 'user' && (d.unreadCount > 0 || selectedDialogIds.includes(d.id))
    );
    
    // Bước 2: Filter theo type được chọn
    let filtered = groupsAndChannels.filter((d) => {
      if (filterType === 'group' && d.type !== 'group' && d.type !== 'megagroup') {
        return false;
      }
      if (filterType === 'channel' && d.type !== 'channel') {
        return false;
      }
      if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
    
    // Bước 3: Sắp xếp theo option được chọn
    return filtered.sort((a, b) => {
      if (sortBy === 'unread') {
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      } else {
        const dateA = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
        const dateB = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
        return dateB - dateA;
      }
    });
  }, [dialogs, filterType, searchQuery, sortBy, selectedDialogIds]);

  /**
   * Đếm số lượng theo type
   */
  const typeCounts = useMemo(() => {
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
    <div className={`card h-full flex flex-col overflow-hidden p-3 transition-all duration-300 ease-in-out ${
      isGroupSelectorCollapsed ? 'w-[60px]' : 'w-full'
    }`}>
      {/* Nội dung chính - ẩn khi collapsed */}
      {!isGroupSelectorCollapsed && (
        <>
          {/* Header - Compact */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Chọn Groups</h2>
                <p className="text-[10px] text-gray-500">{typeCounts.all} có tin mới</p>
              </div>
            </div>
            
            {/* Button group: Refresh + Collapse */}
            <div className="flex items-center gap-1">
              <button
                onClick={fetchDialogs}
                disabled={isLoading}
                className="btn-ghost p-2 rounded-lg hover:bg-surface-light"
                title="Làm mới danh sách"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : 'text-gray-400'}`} />
              </button>
              
              {/* Collapse Button - Ở góc trên bên phải */}
              <button
                onClick={toggleGroupSelectorCollapse}
                className="btn-ghost p-2 rounded-lg hover:bg-surface-light group"
                title="Thu gọn"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>

          {/* Search - Compact */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm group..."
              className="input pl-10 py-2 text-sm bg-surface-light/50 border-white/5 rounded-lg"
            />
          </div>

          {/* Filter tabs - Compact */}
          <div className="flex gap-1.5 mb-3">
            {[
              { key: 'all', label: 'Tất cả', count: typeCounts.all },
              { key: 'group', label: 'Groups', count: typeCounts.group },
              { key: 'channel', label: 'Channels', count: typeCounts.channel },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filterType === tab.key
                    ? 'filter-pill-active text-white'
                    : 'filter-pill text-gray-400 hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Smart Action Bar - Compact */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent border-none text-gray-400 text-xs focus:ring-0 cursor-pointer hover:text-white transition-colors"
              >
                <option value="time" className="bg-surface">Thời gian</option>
                <option value="unread" className="bg-surface">Tin chưa đọc</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={selectAllDialogs} 
                className="btn-ghost text-[10px] py-1 px-2 rounded flex items-center gap-1 hover:text-primary"
                title="Chọn tất cả"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={deselectAllDialogs} 
                className="btn-ghost text-[10px] py-1 px-2 rounded flex items-center gap-1 hover:text-error"
                title="Bỏ chọn"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
              
              <div className="ml-1 px-2 py-1 rounded bg-surface-light/50 text-[10px]">
                <span className="text-primary font-semibold">{selectedDialogIds.length}</span>
                <span className="text-gray-500"> chọn</span>
              </div>
            </div>
          </div>

          {/* Dialog list - Compact cards */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pt-0.5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                <p className="text-gray-500 text-sm">Đang tải danh sách...</p>
              </div>
            ) : filteredDialogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-surface-light/50 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500">
                  {searchQuery ? 'Không tìm thấy kết quả' : 'Không có groups nào có tin mới'}
                </p>
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
        </>
      )}

      {/* Collapsed state - chỉ hiện icon và nút expand */}
      {isGroupSelectorCollapsed && (
        <div className="flex flex-col h-full">
          {/* Header vùng với nút expand */}
          <div className="flex items-center justify-end mb-3">
            <button
              onClick={toggleGroupSelectorCollapse}
              className="btn-ghost p-2 rounded-lg hover:bg-surface-light group"
              title="Mở rộng"
            >
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
            </button>
          </div>
          
          {/* Icon chính ở giữa */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            
            {/* Badge hiển thị số groups đã chọn */}
            {selectedDialogIds.length > 0 && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs font-bold text-white">{selectedDialogIds.length}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * DialogItem - Hiển thị một dialog với Glassmorphism card
 * 
 * @param dialog - Dialog data bao gồm photoUrl
 * @param isSelected - Có đang được chọn hay không
 * @param onToggle - Callback khi toggle selection
 * @description Card có hover effect, glow khi selected, avatar thực từ Telegram
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
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
    prevUnreadRef.current = dialog.unreadCount;
  }, [dialog.unreadCount]);

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-2.5 text-left cursor-pointer ${
        isSelected ? 'glass-card glass-card-selected' : 'glass-card'
      } ${dialog.unreadCount === 0 ? 'opacity-60' : ''}`}
    >
      {/* Checkbox - Compact */}
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          isSelected 
            ? 'bg-primary border-primary shadow-md shadow-primary/30' 
            : 'border-gray-500/50 hover:border-gray-400'
        }`}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Avatar - Smaller */}
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
          isSelected ? 'avatar-glow' : ''
        } ${dialog.type === 'channel' ? 'bg-secondary/20' : 'bg-primary/20'}`}
      >
        {dialog.photoUrl ? (
          <img 
            src={dialog.photoUrl} 
            alt={dialog.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon className={`w-4 h-4 ${dialog.type === 'channel' ? 'text-secondary' : 'text-primary'}`} />
        )}
      </div>

      {/* Info - Compact */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-white truncate">{dialog.title}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500">{TYPE_LABELS[dialog.type]}</span>
          {dialog.unreadCount > 0 ? (
            <span 
              className={`badge-unread px-2 py-0.5 rounded-full text-[10px] transition-transform ${
                isAnimating ? 'animate-pulse scale-110' : ''
              }`}
            >
              {dialog.unreadCount > 999 ? '999+' : dialog.unreadCount} chưa đọc
            </span>
          ) : (
            <span className="badge-read px-1.5 py-0.5 rounded-full text-[10px]">
              ✓ Đã đọc
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
