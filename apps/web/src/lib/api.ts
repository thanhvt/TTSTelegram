/**
 * API Client - Gọi API backend
 *
 * @description Wrapper cho fetch API với error handling
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Gọi API và xử lý response
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'API request failed');
  }

  return json.data as T;
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  /**
   * Lấy trạng thái xác thực
   */
  getStatus: () =>
    fetchApi<{ status: string }>('/auth/status'),

  /**
   * Gửi mã OTP đến số điện thoại
   */
  sendCode: (phoneNumber: string) =>
    fetchApi<{ message: string }>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),

  /**
   * Xác nhận mã OTP và đăng nhập
   */
  signIn: (phoneNumber: string, code: string, password?: string) =>
    fetchApi<{ sessionString: string }>('/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code, password }),
    }),

  /**
   * Đăng xuất
   */
  logout: () =>
    fetchApi<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),
};

// ============================================
// DIALOGS API
// ============================================

export interface Dialog {
  id: string;
  title: string;
  type: 'group' | 'channel' | 'user' | 'megagroup';
  unreadCount: number;
  lastMessage?: string;
  lastMessageDate?: string;
}

export const dialogsApi = {
  /**
   * Lấy danh sách dialogs
   */
  getDialogs: (limit = 50, type?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (type) params.append('type', type);
    return fetchApi<Dialog[]>(`/dialogs?${params}`);
  },
};

// ============================================
// MESSAGES API
// ============================================

export interface Message {
  id: number;
  dialogId: string;
  text: string;
  senderName: string;
  date: string;
  isOutgoing: boolean;
}

export const messagesApi = {
  /**
   * Lấy tin nhắn từ một dialog
   */
  getMessages: (dialogId: string, limit = 50) =>
    fetchApi<Message[]>(`/messages/${dialogId}?limit=${limit}`),

  /**
   * Lấy tin nhắn từ nhiều dialogs
   */
  getBatchMessages: (dialogIds: string[], limit = 50) =>
    fetchApi<Record<string, Message[]>>('/messages/batch', {
      method: 'POST',
      body: JSON.stringify({ dialogIds, limit }),
    }),

  /**
   * Đánh dấu tin nhắn đã đọc trên Telegram
   *
   * @param dialogId - ID của dialog
   * @param messageIds - Mảng các ID tin nhắn cần đánh dấu đã đọc
   * @returns Promise<{ marked: number }> - Số lượng tin nhắn đã đánh dấu
   */
  markAsRead: (dialogId: string, messageIds: number[]) =>
    fetchApi<{ marked: number }>('/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify({ dialogId, messageIds }),
    }),
};

// ============================================
// TTS API
// ============================================

export type TTSProvider = 'google' | 'openai';

export interface TTSVoice {
  id: string;
  name: string;
  shortName: string;
  gender: 'Male' | 'Female' | 'Neutral';
  locale: string;
  description?: string;
  provider: TTSProvider;
}

export interface TTSResult {
  id: string;
  audioUrl: string;
  duration: number;
  text: string;
  voiceUsed?: string;
  providerUsed?: TTSProvider;
}

export interface TTSSynthesizeOptions {
  text: string;
  provider?: TTSProvider;
  voice?: string;
  randomVoice?: boolean;
  rate?: number;
}

export const ttsApi = {
  /**
   * Lấy danh sách giọng đọc và trạng thái OpenAI
   */
  getVoices: (provider?: TTSProvider) =>
    fetchApi<{ voices: TTSVoice[]; openaiAvailable: boolean }>(
      provider ? `/tts/voices?provider=${provider}` : '/tts/voices'
    ),

  /**
   * Tạo audio từ text
   *
   * @param options - Options bao gồm text, provider, voice, randomVoice, rate
   */
  synthesize: (options: TTSSynthesizeOptions) =>
    fetchApi<TTSResult>('/tts/synthesize', {
      method: 'POST',
      body: JSON.stringify(options),
    }),

  /**
   * Tạo audio cho nhiều tin nhắn
   */
  synthesizeBatch: (messages: Array<{ id: string; text: string }>, voice?: string, provider?: TTSProvider) =>
    fetchApi<TTSResult[]>('/tts/synthesize-batch', {
      method: 'POST',
      body: JSON.stringify({ messages, voice, provider }),
    }),

  /**
   * Lấy URL stream audio
   */
  getStreamUrl: (id: string) => `${API_BASE}/tts/stream/${id}`,

  /**
   * Xóa audio
   */
  deleteAudio: (id: string) =>
    fetchApi<{ message: string }>(`/tts/${id}`, {
      method: 'DELETE',
    }),
};

