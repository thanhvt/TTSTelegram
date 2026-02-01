/**
 * useKeyboardShortcuts - Hook xử lý phím tắt
 *
 * @description Đăng ký các phím tắt điều khiển player
 * @usage Gọi trong component chính (App)
 *
 * Phím tắt:
 * - Space: Play/Pause
 * - N: Next message
 * - P: Previous message
 * - S: Skip group (next group)
 * - ArrowLeft: Rewind 5s
 * - ArrowRight: Forward 5s
 * - ArrowUp: Tăng volume
 * - ArrowDown: Giảm volume
 */

import { useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

interface KeyboardShortcutsOptions {
  onPlayPause?: () => void;
  onSeek?: (seconds: number) => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const {
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    nextInQueue,
    previousInQueue,
    queue,
    currentQueueIndex,
    setCurrentQueueIndex,
  } = useAppStore();

  const { onPlayPause, onSeek } = options;

  /**
   * Skip đến group tiếp theo trong queue
   */
  const skipToNextGroup = useCallback(() => {
    if (queue.length === 0) return;

    const currentItem = queue[currentQueueIndex];
    if (!currentItem) return;

    const currentDialogId = currentItem.message.dialogId;

    // Tìm item đầu tiên của group tiếp theo
    const nextGroupIndex = queue.findIndex(
      (item, index) =>
        index > currentQueueIndex && item.message.dialogId !== currentDialogId
    );

    if (nextGroupIndex !== -1) {
      setCurrentQueueIndex(nextGroupIndex);
    }
  }, [queue, currentQueueIndex, setCurrentQueueIndex]);

  /**
   * Xử lý keydown event
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Bỏ qua nếu đang focus vào input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case ' ':
          // Space: Play/Pause
          event.preventDefault();
          if (onPlayPause) {
            onPlayPause();
          } else {
            setIsPlaying(!isPlaying);
          }
          break;

        case 'n':
        case 'N':
          // N: Next message
          event.preventDefault();
          nextInQueue();
          break;

        case 'p':
        case 'P':
          // P: Previous message
          event.preventDefault();
          previousInQueue();
          break;

        case 's':
        case 'S':
          // S: Skip group
          event.preventDefault();
          skipToNextGroup();
          break;

        case 'ArrowLeft':
          // Left Arrow: Rewind 5s
          event.preventDefault();
          onSeek?.(-5);
          break;

        case 'ArrowRight':
          // Right Arrow: Forward 5s
          event.preventDefault();
          onSeek?.(5);
          break;

        case 'ArrowUp':
          // Up Arrow: Volume up
          event.preventDefault();
          setVolume(Math.min(volume + 0.1, 1));
          break;

        case 'ArrowDown':
          // Down Arrow: Volume down
          event.preventDefault();
          setVolume(Math.max(volume - 0.1, 0));
          break;

        case 'm':
        case 'M':
          // M: Mute/Unmute
          event.preventDefault();
          setVolume(volume === 0 ? 0.8 : 0);
          break;
      }
    },
    [
      isPlaying,
      setIsPlaying,
      volume,
      setVolume,
      nextInQueue,
      previousInQueue,
      skipToNextGroup,
      onPlayPause,
      onSeek,
    ]
  );

  // Đăng ký event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: [
      { key: 'Space', action: 'Play/Pause' },
      { key: 'N', action: 'Tin nhắn tiếp' },
      { key: 'P', action: 'Tin nhắn trước' },
      { key: 'S', action: 'Skip group' },
      { key: '←/→', action: 'Tua -5s/+5s' },
      { key: '↑/↓', action: 'Volume' },
      { key: 'M', action: 'Mute' },
    ],
  };
}
