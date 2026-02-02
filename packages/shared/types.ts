/**
 * Shared Types - Các kiểu dữ liệu dùng chung giữa API và Web
 *
 * @description Định nghĩa interfaces và types cho toàn bộ ứng dụng
 */

// ============================================
// TELEGRAM TYPES
// ============================================

/**
 * Thông tin một dialog (group/channel/chat)
 */
export interface TelegramDialog {
  id: string;
  title: string;
  type: 'group' | 'channel' | 'user' | 'megagroup';
  unreadCount: number;
  lastMessage?: string;
  lastMessageDate?: Date;
  photoUrl?: string; // URL hoặc base64 của avatar
}

/**
 * Thông tin một tin nhắn
 */
export interface TelegramMessage {
  id: number;
  dialogId: string;
  text: string;
  senderName: string;
  date: Date;
  isOutgoing: boolean;
}

// ============================================
// AUTH TYPES
// ============================================

/**
 * Trạng thái xác thực Telegram
 */
export type AuthStatus =
  | 'disconnected'
  | 'awaiting_phone'
  | 'awaiting_code'
  | 'awaiting_2fa'
  | 'connected';

export interface AuthState {
  status: AuthStatus;
  phoneNumber?: string;
  phoneCodeHash?: string;
}

// ============================================
// TTS TYPES
// ============================================

/**
 * Giọng đọc TTS
 */
export interface TTSVoice {
  name: string;
  shortName: string;
  gender: 'Male' | 'Female';
  locale: string;
}

/**
 * Yêu cầu tạo audio
 */
export interface TTSSynthesizeRequest {
  text: string;
  voice?: string;
  rate?: number; // -50% to +100%
  volume?: number; // -50% to +50%
  pitch?: number; // -50Hz to +50Hz
}

/**
 * Kết quả tạo audio
 */
export interface TTSSynthesizeResponse {
  id: string;
  audioUrl: string;
  duration: number;
  text: string;
}

// ============================================
// PLAYER TYPES
// ============================================

/**
 * Item trong queue phát
 */
export interface QueueItem {
  id: string;
  message: TelegramMessage;
  audioUrl?: string;
  status: 'pending' | 'generating' | 'ready' | 'playing' | 'completed' | 'error';
  error?: string;
}

/**
 * Trạng thái player
 */
export interface PlayerState {
  isPlaying: boolean;
  currentItem?: QueueItem;
  queue: QueueItem[];
  volume: number;
  playbackRate: number;
  currentTime: number;
  duration: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
