/**
 * Dialogs API Service - Lấy danh sách groups/channels
 *
 * @description Gọi endpoint GET /dialogs
 */

import { apiClient } from './client';
import { TelegramDialog } from '../../stores/appStore';

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Lấy danh sách tất cả dialogs (groups, channels)
 *
 * @returns Danh sách TelegramDialog[] với unreadCount
 * 
 * @note apiClient đã unwrap data từ {success: true, data: [...]} thành [...] trực tiếp
 */
export async function getDialogs(): Promise<TelegramDialog[]> {
  // apiClient trả về data trực tiếp (đã unwrap từ response.data)
  const dialogs = await apiClient<TelegramDialog[]>('/dialogs');
  console.log('[getDialogs] Received dialogs:', dialogs?.length ?? 0);
  // Đảm bảo luôn trả về mảng, tránh lỗi khi response là undefined/null
  return dialogs ?? [];
}

