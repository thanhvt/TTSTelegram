/**
 * MessageQueue - Hiển thị danh sách tin nhắn trong queue
 *
 * @description Queue các tin nhắn đang chờ đọc
 */

import { Trash2, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { useAppStore, QueueItem } from '../stores/appStore';

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
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có tin nhắn trong queue</p>
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
      <div className="flex items-start gap-2">
        {/* Index */}
        <span className="text-xs text-gray-500 mt-1">#{index + 1}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Group name */}
          <div className="text-xs text-gray-400 mb-1">{item.dialogTitle}</div>
          {/* Message text */}
          <div className="text-sm text-white line-clamp-2">{item.message.text}</div>
          {/* Error message */}
          {item.error && (
            <div className="flex items-center gap-1 text-xs text-error mt-1">
              <AlertCircle className="w-3 h-3" />
              {item.error}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className={`px-2 py-1 rounded text-xs ${STATUS_STYLES[item.status]}`}>
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
          className="p-1 text-gray-500 hover:text-error"
          title="Xóa khỏi queue"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
