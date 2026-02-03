/**
 * useQueue Hook - Quản lý message queue
 *
 * @description Load messages từ selected groups và thêm vào queue
 */

import { useCallback, useState } from 'react';
import { useAppStore, QueueItem, TelegramMessage } from '../stores/appStore';
import { messagesApi } from '../services/api';

/**
 * useQueue Hook
 *
 * @returns Object với queue operations
 *
 * @example
 * const { loadMessagesFromGroups, isLoading } = useQueue();
 * await loadMessagesFromGroups();
 */
export function useQueue() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    dialogs,
    selectedDialogIds,
    addToQueue,
    clearQueue,
  } = useAppStore();

  /**
   * Load unread messages từ selected groups và thêm vào queue
   *
   * @returns Số lượng messages đã thêm
   */
  const loadMessagesFromGroups = useCallback(async (): Promise<number> => {
    if (selectedDialogIds.length === 0) {
      setError('Vui lòng chọn ít nhất một group');
      return 0;
    }

    setIsLoading(true);
    setError(null);
    clearQueue();

    let totalMessages = 0;

    try {
      // Load messages từ từng group
      for (const dialogId of selectedDialogIds) {
        const dialog = dialogs.find((d) => d.id === dialogId);
        if (!dialog) continue;

        try {
          // Lấy unread messages
          const messages = await messagesApi.getMessages(
            dialogId,
            dialog.unreadCount > 0 ? dialog.unreadCount : 20 // Lấy ít nhất 20 nếu không có unread
          );

          // Chuyển đổi thành QueueItems
          const queueItems: QueueItem[] = messages.map((msg: TelegramMessage) => ({
            id: `${dialogId}-${msg.id}`,
            message: msg,
            dialogTitle: dialog.title,
            status: 'pending' as const,
          }));

          if (queueItems.length > 0) {
            addToQueue(queueItems);
            totalMessages += queueItems.length;
          }
        } catch (err) {
          console.error(`Lỗi load messages từ ${dialog.title}:`, err);
          // Tiếp tục với group khác
        }
      }

      return totalMessages;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(message);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [selectedDialogIds, dialogs, addToQueue, clearQueue]);

  /**
   * Clear queue và error
   */
  const reset = useCallback(() => {
    clearQueue();
    setError(null);
  }, [clearQueue]);

  return {
    loadMessagesFromGroups,
    reset,
    isLoading,
    error,
  };
}
