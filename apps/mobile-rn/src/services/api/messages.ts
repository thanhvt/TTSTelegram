/**
 * Messages API Service - Lấy tin nhắn từ dialogs
 *
 * @description Gọi endpoints /messages/*
 */

import { apiClient } from './client';
import { TelegramMessage } from '../../stores/appStore';

// ============================================
// TYPES
// ============================================

interface MarkAsReadRequest {
  messageIds: number[];
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Lấy tin nhắn từ một dialog
 *
 * @param dialogId - ID của group/channel
 * @param limit - Số tin nhắn tối đa (mặc định 50)
 * @returns Danh sách TelegramMessage[]
 */
export async function getMessages(
  dialogId: string,
  limit: number = 50
): Promise<TelegramMessage[]> {
  // API trả về array messages trực tiếp (đã được unwrap từ data.data trong client.ts)
  const messages = await apiClient<TelegramMessage[]>(
    `/messages/${dialogId}?limit=${limit}`
  );
  
  // Đảm bảo luôn trả về array
  return Array.isArray(messages) ? messages : [];
}

/**
 * Đánh dấu tin nhắn đã đọc
 *
 * @param dialogId - ID của dialog
 * @param messageIds - Danh sách ID tin nhắn đã đọc
 */
export async function markAsRead(
  dialogId: string,
  messageIds: number[]
): Promise<void> {
  await apiClient(`/messages/${dialogId}/read`, {
    method: 'POST',
    body: JSON.stringify({ messageIds } as MarkAsReadRequest),
  });
}
