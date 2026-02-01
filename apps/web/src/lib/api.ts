/**
 * API Client - Gọi API backend
 *
 * @description Wrapper cho fetch API với error handling
 */

const API_BASE = '/api';

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
};

// ============================================
// TTS API
// ============================================

export interface TTSVoice {
  name: string;
  shortName: string;
  gender: 'Male' | 'Female';
  locale: string;
}

export interface TTSResult {
  id: string;
  audioUrl: string;
  duration: number;
  text: string;
}

export const ttsApi = {
  /**
   * Lấy danh sách giọng đọc
   */
  getVoices: (locale = 'vi-VN') =>
    fetchApi<TTSVoice[]>(`/tts/voices?locale=${locale}`),

  /**
   * Tạo audio từ text
   */
  synthesize: (text: string, voice?: string, rate?: number) =>
    fetchApi<TTSResult>('/tts/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text, voice, rate }),
    }),

  /**
   * Tạo audio cho nhiều tin nhắn
   */
  synthesizeBatch: (messages: Array<{ id: string; text: string }>, voice?: string) =>
    fetchApi<TTSResult[]>('/tts/synthesize-batch', {
      method: 'POST',
      body: JSON.stringify({ messages, voice }),
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
