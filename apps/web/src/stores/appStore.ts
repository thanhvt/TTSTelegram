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

interface AppState {
  // Auth
  authStatus: AuthStatus;
  phoneNumber: string;
  setAuthStatus: (status: AuthStatus) => void;
  setPhoneNumber: (phone: string) => void;

  // Dialogs
  dialogs: TelegramDialog[];
  selectedDialogIds: string[];
  setDialogs: (dialogs: TelegramDialog[]) => void;
  toggleDialogSelection: (dialogId: string) => void;
  selectAllDialogs: () => void;
  deselectAllDialogs: () => void;

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
  selectedVoice: string;
  randomVoice: boolean; // Chế độ ngẫu nhiên giọng đọc
  setSelectedVoice: (voice: string) => void;
  setRandomVoice: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      authStatus: 'disconnected' as AuthStatus,
      phoneNumber: '+84376340112', // Số điện thoại mặc định của anh Thành
      setAuthStatus: (status: AuthStatus) => set({ authStatus: status }),
      setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),

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
      selectedVoice: 'vi', // Google TTS Vietnamese
      randomVoice: false, // Chế độ ngẫu nhiên giọng đọc
      setSelectedVoice: (voice) => set({ selectedVoice: voice }),
      setRandomVoice: (enabled) => set({ randomVoice: enabled }),
    }),
    {
      name: 'tts-telegram-storage',
      version: 1, // Tăng version để migrate từ Edge TTS sang Google TTS
      partialize: (state) => ({
        selectedDialogIds: state.selectedDialogIds,
        volume: state.volume,
        playbackRate: state.playbackRate,
        selectedVoice: state.selectedVoice,
        randomVoice: state.randomVoice,
      }),
      // Migrate từ Edge TTS voice format sang Google TTS
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<AppState>;
        if (version === 0) {
          // Migrate voice từ Edge TTS format (vi-VN-HoaiMyNeural) sang Google TTS (vi)
          if (state.selectedVoice && state.selectedVoice.includes('-VN-')) {
            state.selectedVoice = 'vi';
          }
        }
        return state;
      },
    }
  )
);
