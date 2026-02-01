/**
 * GroupSelector - Component chọn groups để đọc
 *
 * @description Hiển thị danh sách groups/channels với checkbox
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Users,
  Radio,
  User,
  CheckSquare,
  Square,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { dialogsApi } from '../lib/api';
import { useAppStore, TelegramDialog } from '../stores/appStore';

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
   * Filter dialogs theo search và type
   */
  const filteredDialogs = useMemo(() => {
    return dialogs.filter((d) => {
      // Filter theo type
      if (filterType !== 'all' && d.type !== filterType) {
        return false;
      }
      // Filter theo search
      if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [dialogs, filterType, searchQuery]);

  /**
   * Đếm số lượng theo type
   */
  const typeCounts = useMemo(() => {
    return {
      all: dialogs.length,
      group: dialogs.filter((d) => d.type === 'group' || d.type === 'megagroup').length,
      channel: dialogs.filter((d) => d.type === 'channel').length,
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
 * DialogItem - Hiển thị một dialog
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

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
        isSelected
          ? 'bg-primary/20 border border-primary/50'
          : 'bg-surface-light/50 hover:bg-surface-light border border-transparent'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isSelected ? 'bg-primary border-primary' : 'border-gray-500'
        }`}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="text-xs text-gray-500">
          {TYPE_LABELS[dialog.type]}
          {dialog.unreadCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary rounded-full text-white">
              {dialog.unreadCount} chưa đọc
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
