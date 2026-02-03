/**
 * Dialogs API Service - Lấy danh sách groups/channels
 *
 * @description Gọi endpoint GET /dialogs
 */

import { apiClient } from './client';
import { TelegramDialog } from '../../stores/appStore';

// ============================================
// TYPES
// ============================================

interface DialogsResponse {
  dialogs: TelegramDialog[];
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Lấy danh sách tất cả dialogs (groups, channels)
 *
 * @returns Danh sách TelegramDialog[] với unreadCount
 */
export async function getDialogs(): Promise<TelegramDialog[]> {
  const response = await apiClient<DialogsResponse>('/dialogs');
  // Đảm bảo luôn trả về mảng, tránh lỗi khi response là undefined/null
  return response?.dialogs ?? [];
}
