/**
 * App Store - Zustand store quản lý state toàn ứng dụng
 *
 * @description Quản lý: auth state, dialogs, messages, queue, player
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface TelegramDialog {
  id: string;
  title: string;
  type: 'group' | 'channel' | 'user' | 'megagroup';
  unreadCount: number;
  lastMessage?: string;
  lastMessageDate?: Date;
}

export interface TelegramMessage {
  id: number;
  dialogId: string;
  text: string;
  senderName: string;
  date: Date;
  isOutgoing: boolean;
}

export interface QueueItem {
  id: string;
  message: TelegramMessage;
  dialogTitle: string;
  audioUrl?: string;
  status: 'pending' | 'generating' | 'ready' | 'playing' | 'completed' | 'error';
  error?: string;
}

export type AuthStatus =
  | 'disconnected'
  | 'awaiting_phone'
  | 'awaiting_code'
  | 'awaiting_2fa'
  | 'connected';

/**
 * Theme type - các bảng màu có sẵn
 * @description 4 bảng màu: Midnight Audio, Fintech Trust, Terminal Green, Ocean Calm
 */
export type ThemeType = 'midnight-audio' | 'fintech-trust' | 'terminal-green' | 'ocean-calm';

interface AppState {
  // Auth
  authStatus: AuthStatus;
  phoneNumber: string;
  /**
   * Session string của Telegram để khôi phục đăng nhập
   * @description Được lưu vào localStorage sau khi đăng nhập thành công
   */
  sessionString: string;
  setAuthStatus: (status: AuthStatus) => void;
  setPhoneNumber: (phone: string) => void;
  /**
   * Lưu session string sau khi đăng nhập thành công
   * @param session - Chuỗi session từ Telegram API
   */
  setSessionString: (session: string) => void;
  /**
   * Xóa session string khi đăng xuất
   */
  clearSessionString: () => void;

  // Dialogs
  dialogs: TelegramDialog[];
  selectedDialogIds: string[];
  setDialogs: (dialogs: TelegramDialog[]) => void;
  toggleDialogSelection: (dialogId: string) => void;
  selectAllDialogs: () => void;
  deselectAllDialogs: () => void;
  /**
   * Giảm unreadCount của dialog đi 1
   * @param dialogId - ID của dialog cần giảm
   * @description Được gọi sau khi tin nhắn được đọc xong trong useAudioPlayer
   */
  decrementUnreadCount: (dialogId: string) => void;
  /**
   * Cập nhật unreadCount của dialog từ server
   * @param dialogId - ID của dialog cần cập nhật
   * @param count - Số lượng tin nhắn chưa đọc mới
   * @description Được gọi khi manual refresh danh sách dialogs
   */
  updateDialogUnreadCount: (dialogId: string, count: number) => void;

  // Messages & Queue
  messages: Record<string, TelegramMessage[]>;
  queue: QueueItem[];
  currentQueueIndex: number;
  setMessages: (dialogId: string, messages: TelegramMessage[]) => void;
  addToQueue: (items: QueueItem[]) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void;
  setCurrentQueueIndex: (index: number) => void;
  nextInQueue: () => void;
  previousInQueue: () => void;

  // Player
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;

  // Settings
  ttsProvider: 'google' | 'openai' | 'google-cloud';
  selectedVoice: string;
  randomVoice: boolean;
  theme: ThemeType;
  setTtsProvider: (provider: 'google' | 'openai' | 'google-cloud') => void;
  setSelectedVoice: (voice: string) => void;
  setRandomVoice: (enabled: boolean) => void;
  setTheme: (theme: ThemeType) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      authStatus: 'disconnected' as AuthStatus,
      phoneNumber: '+84376340112', // Số điện thoại mặc định của anh Thành
      sessionString: '', // Session string để khôi phục sau khi reload
      setAuthStatus: (status: AuthStatus) => set({ authStatus: status }),
      setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),
      setSessionString: (session: string) => set({ sessionString: session }),
      clearSessionString: () => set({ sessionString: '' }),

      // Dialogs
      dialogs: [],
      selectedDialogIds: [],
      setDialogs: (dialogs) => set({ dialogs }),
      toggleDialogSelection: (dialogId) =>
        set((state) => ({
          selectedDialogIds: state.selectedDialogIds.includes(dialogId)
            ? state.selectedDialogIds.filter((id) => id !== dialogId)
            : [...state.selectedDialogIds, dialogId],
        })),
      selectAllDialogs: () =>
        set((state) => ({
          selectedDialogIds: state.dialogs
            .filter((d) => d.type === 'group' || d.type === 'megagroup' || d.type === 'channel')
            .map((d) => d.id),
        })),
      deselectAllDialogs: () => set({ selectedDialogIds: [] }),
      /**
       * Giảm unreadCount của dialog đi 1 khi tin nhắn được đọc xong
       */
      decrementUnreadCount: (dialogId) =>
        set((state) => ({
          dialogs: state.dialogs.map((d) =>
            d.id === dialogId
              ? { ...d, unreadCount: Math.max(0, d.unreadCount - 1) }
              : d
          ),
        })),
      /**
       * Cập nhật unreadCount của dialog từ server
       */
      updateDialogUnreadCount: (dialogId, count) =>
        set((state) => ({
          dialogs: state.dialogs.map((d) =>
            d.id === dialogId ? { ...d, unreadCount: count } : d
          ),
        })),

      // Messages & Queue
      messages: {},
      queue: [],
      currentQueueIndex: 0,
      setMessages: (dialogId, messages) =>
        set((state) => ({
          messages: { ...state.messages, [dialogId]: messages },
        })),
      addToQueue: (items) =>
        set((state) => ({
          queue: [...state.queue, ...items],
        })),
      removeFromQueue: (id) =>
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== id),
        })),
      clearQueue: () => set({ queue: [], currentQueueIndex: 0 }),
      updateQueueItem: (id, updates) =>
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      setCurrentQueueIndex: (index) => set({ currentQueueIndex: index }),
      nextInQueue: () =>
        set((state) => ({
          currentQueueIndex: Math.min(state.currentQueueIndex + 1, state.queue.length - 1),
        })),
      previousInQueue: () =>
        set((state) => ({
          currentQueueIndex: Math.max(state.currentQueueIndex - 1, 0),
        })),

      // Player
      isPlaying: false,
      volume: 0.8,
      playbackRate: 1,
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setVolume: (volume) => set({ volume }),
      setPlaybackRate: (rate) => set({ playbackRate: rate }),

      // Settings
      ttsProvider: 'google' as const,
      selectedVoice: 'vi',
      randomVoice: false,
      setTtsProvider: (provider) => set({ 
        ttsProvider: provider,
        // Reset voice to default khi đổi provider
        selectedVoice: provider === 'openai' ? 'nova' : provider === 'google-cloud' ? 'vi-VN-Neural2-A' : 'vi'
      }),
      setSelectedVoice: (voice) => set({ selectedVoice: voice }),
      setRandomVoice: (enabled) => set({ randomVoice: enabled }),
      
      // Theme
      theme: 'ocean-calm' as ThemeType,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'tts-telegram-storage',
      version: 3, // Tăng version để thêm theme
      partialize: (state) => ({
        selectedDialogIds: state.selectedDialogIds,
        volume: state.volume,
        playbackRate: state.playbackRate,
        ttsProvider: state.ttsProvider,
        selectedVoice: state.selectedVoice,
        randomVoice: state.randomVoice,
        theme: state.theme,
        sessionString: state.sessionString, // Persist session để auto-login
        phoneNumber: state.phoneNumber, // Persist số điện thoại
      }),
      // Migrate từ version cũ
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<AppState>;
        if (version < 1) {
          // Migrate voice từ Edge TTS format sang Google TTS
          if (state.selectedVoice && state.selectedVoice.includes('-VN-')) {
            state.selectedVoice = 'vi';
          }
        }
        if (version < 2) {
          // Thêm ttsProvider mặc định
          state.ttsProvider = 'google';
        }
        if (version < 3) {
          // Thêm theme mặc định
          state.theme = 'ocean-calm';
        }
        return state;
      },
    }
  )
);
