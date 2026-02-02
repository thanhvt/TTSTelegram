/**
 * MessageQueue - Hiển thị danh sách tin nhắn trong queue
 *
 * @description Queue các tin nhắn đang chờ đọc
 */

import { Trash2, MessageSquare, AlertCircle, Loader2, User, Clock } from 'lucide-react';
import { useAppStore, QueueItem } from '../stores/appStore';

/**
 * Format ngày giờ tin nhắn
 * @param date - ngày giờ của tin nhắn
 * @returns chuỗi định dạng "dd/mm HH:mm" hoặc "Hôm nay HH:mm"
 */
function formatMessageDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  
  if (messageDay.getTime() === today.getTime()) {
    return `Hôm nay ${time}`;
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDay.getTime() === yesterday.getTime()) {
    return `Hôm qua ${time}`;
  }
  
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${time}`;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-500/20 text-gray-400',
  generating: 'bg-warning/20 text-warning',
  ready: 'bg-primary/20 text-primary',
  playing: 'bg-success/20 text-success animate-pulse',
  completed: 'bg-success/20 text-success opacity-50',
  error: 'bg-error/20 text-error',
};

export function MessageQueue() {
  const { queue, currentQueueIndex, removeFromQueue, clearQueue, setCurrentQueueIndex } =
    useAppStore();

  if (queue.length === 0) {
    return (
      <div className="card h-full flex flex-col">
        <h2 className="text-lg font-semibold text-white mb-4">Queue</h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            {/* Empty State Illustration - SVG với animation */}
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center animate-pulse">
                <MessageSquare className="w-12 h-12 text-primary/60" />
              </div>
              {/* Decorative dots */}
              <div className="absolute top-0 right-1/4 w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="absolute bottom-2 left-1/4 w-1.5 h-1.5 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
            
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              Chưa có tin nhắn trong queue
            </h3>
            <p className="text-sm text-gray-500 max-w-[200px] mx-auto">
              Chọn groups bên trái và bấm <span className="text-primary font-medium">"Bắt đầu đọc"</span> để bắt đầu
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Queue ({queue.length} tin nhắn)
        </h2>
        <button
          onClick={clearQueue}
          className="btn-ghost text-sm text-error hover:bg-error/20"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Xóa tất cả
        </button>
      </div>

      {/* Queue Stats */}
      <div className="flex gap-2 mb-3 text-xs">
        <span className="px-2 py-1 bg-success/20 text-success rounded">
          Hoàn thành: {queue.filter((q) => q.status === 'completed').length}
        </span>
        <span className="px-2 py-1 bg-primary/20 text-primary rounded">
          Còn lại: {queue.filter((q) => q.status !== 'completed').length}
        </span>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {queue.map((item, index) => (
          <QueueItemComponent
            key={item.id}
            item={item}
            index={index}
            isCurrent={index === currentQueueIndex}
            onSelect={() => setCurrentQueueIndex(index)}
            onRemove={() => removeFromQueue(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * QueueItemComponent - Hiển thị một item trong queue
 */
function QueueItemComponent({
  item,
  index,
  isCurrent,
  onSelect,
  onRemove,
}: {
  item: QueueItem;
  index: number;
  isCurrent: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isCurrent
          ? 'bg-primary/20 border border-primary/50'
          : 'bg-surface-light/50 hover:bg-surface-light border border-transparent'
      }`}
    >
      {/* Header: Index + Metadata + Actions */}
      <div className="flex items-center gap-2 mb-2">
        {/* Index */}
        <span className="text-xs text-gray-500">#{index + 1}</span>

        {/* Group name + Người post + Thời gian */}
        <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-xs text-gray-400">{item.dialogTitle}</span>
          <span className="text-gray-600">•</span>
          <span className="text-xs text-primary/70 font-medium flex items-center gap-1">
            <User className="w-3 h-3" />
            {item.message.senderName || 'Unknown'}
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatMessageDate(item.message.date)}
          </span>
        </div>

        {/* Status Badge */}
        <div className={`px-2 py-1 rounded text-xs whitespace-nowrap ${STATUS_STYLES[item.status]}`}>
          {item.status === 'generating' && (
            <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
          )}
          {item.status === 'pending' && 'Chờ'}
          {item.status === 'generating' && 'Đang tạo'}
          {item.status === 'ready' && 'Sẵn sàng'}
          {item.status === 'playing' && 'Đang phát'}
          {item.status === 'completed' && '✓'}
          {item.status === 'error' && 'Lỗi'}
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-gray-500 hover:text-error flex-shrink-0"
          title="Xóa khỏi queue"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Message text - Full width */}
      <div className="text-sm text-white overflow-y-auto max-h-20 whitespace-pre-wrap w-full">
        {item.message.text}
      </div>

      {/* Error message */}
      {item.error && (
        <div className="flex items-center gap-1 text-xs text-error mt-2">
          <AlertCircle className="w-3 h-3" />
          {item.error}
        </div>
      )}
    </div>
  );
}
