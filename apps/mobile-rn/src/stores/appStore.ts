/**
 * App Store - Zustand store quản lý state toàn ứng dụng mobile
 *
 * @description Quản lý: auth state, dialogs, messages, queue, player, settings
 * @uses Tương tự web appStore.ts nhưng dùng AsyncStorage cho persist
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType, DEFAULT_THEME } from '../theme';

// ============================================
// TYPES
// ============================================

export type AuthStatus =
  | 'disconnected'
  | 'awaiting_phone'
  | 'awaiting_code'
  | 'awaiting_2fa'
  | 'connected';

export interface TelegramDialog {
  id: string;
  title: string;
  type: 'group' | 'channel' | 'user' | 'megagroup';
  unreadCount: number;
  lastMessage?: string;
  lastMessageDate?: Date;
  photoUrl?: string;
}

export interface TelegramMessage {
  id: number;
  dialogId: string;
  text: string;
  senderName?: string;
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

export type TTSProvider = 'google' | 'openai' | 'google-cloud';

// Loại sắp xếp groups
export type SortBy = 'time' | 'unread';

// ============================================
// STORE INTERFACE
// ============================================

interface AppState {
  // Auth
  authStatus: AuthStatus;
  phoneNumber: string;
  setAuthStatus: (status: AuthStatus) => void;
  setPhoneNumber: (phone: string) => void;

  // Dialogs
  dialogs: TelegramDialog[];
  selectedDialogIds: string[];
  sortBy: SortBy;
  setDialogs: (dialogs: TelegramDialog[]) => void;
  toggleDialogSelection: (dialogId: string) => void;
  selectAllDialogs: () => void;
  setSortBy: (sortBy: SortBy) => void;
  decrementDialogUnread: (dialogId: string) => void;
  getSortedDialogs: () => TelegramDialog[];
  deselectAllDialogs: () => void;

  // Queue
  queue: QueueItem[];
  currentQueueIndex: number;
  addToQueue: (items: QueueItem[]) => void;
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
  ttsProvider: TTSProvider;
  selectedVoice: string;
  randomVoice: boolean;
  theme: ThemeType;
  setTtsProvider: (provider: TTSProvider) => void;
  setSelectedVoice: (voice: string) => void;
  setRandomVoice: (enabled: boolean) => void;
  setTheme: (theme: ThemeType) => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      authStatus: 'disconnected',
      phoneNumber: '',
      setAuthStatus: (status) => set({ authStatus: status }),
      setPhoneNumber: (phone) => set({ phoneNumber: phone }),

      // Dialogs
      dialogs: [],
      selectedDialogIds: [],
      sortBy: 'time' as SortBy,
      setDialogs: (dialogs) => set({ dialogs }),
      toggleDialogSelection: (dialogId) =>
        set((state) => ({
          selectedDialogIds: state.selectedDialogIds.includes(dialogId)
            ? state.selectedDialogIds.filter((id) => id !== dialogId)
            : [...state.selectedDialogIds, dialogId],
        })),
      selectAllDialogs: () =>
        set((state) => ({
          selectedDialogIds: state.dialogs.map((d) => d.id),
        })),
      deselectAllDialogs: () => set({ selectedDialogIds: [] }),
      setSortBy: (sortBy) => set({ sortBy }),
      decrementDialogUnread: (dialogId) =>
        set((state) => ({
          dialogs: state.dialogs.map((d) =>
            d.id === dialogId ? { ...d, unreadCount: Math.max(0, d.unreadCount - 1) } : d
          ),
        })),
      getSortedDialogs: () => {
        const state = get();
        // Đảm bảo dialogs là mảng, tránh lỗi khi state bị undefined
        const dialogList = state.dialogs ?? [];
        const sorted = [...dialogList];
        if (state.sortBy === 'unread') {
          // Sắp xếp theo số tin chưa đọc (nhiều nhất trước)
          sorted.sort((a, b) => b.unreadCount - a.unreadCount);
        } else {
          // Sắp xếp theo thời gian (mới nhất trước)
          sorted.sort((a, b) => {
            const dateA = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
            const dateB = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
            return dateB - dateA;
          });
        }
        return sorted;
      },

      // Queue
      queue: [],
      currentQueueIndex: 0,
      addToQueue: (items) =>
        set((state) => ({
          queue: [...state.queue, ...items],
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
      ttsProvider: 'google',
      selectedVoice: 'vi',
      randomVoice: false,
      theme: DEFAULT_THEME,
      setTtsProvider: (provider) => set({ ttsProvider: provider }),
      setSelectedVoice: (voice) => set({ selectedVoice: voice }),
      setRandomVoice: (enabled) => set({ randomVoice: enabled }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'tts-telegram-mobile',
      storage: createJSONStorage(() => AsyncStorage),
      // Chỉ persist các fields cần thiết (không persist dialogs, queue, isPlaying)
      partialize: (state) => ({
        phoneNumber: state.phoneNumber,
        selectedDialogIds: state.selectedDialogIds,
        volume: state.volume,
        playbackRate: state.playbackRate,
        ttsProvider: state.ttsProvider,
        selectedVoice: state.selectedVoice,
        randomVoice: state.randomVoice,
        theme: state.theme,
      }),
    }
  )
);
