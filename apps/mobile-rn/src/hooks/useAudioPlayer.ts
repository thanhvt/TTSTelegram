/**
 * useAudioPlayer Hook - Quản lý audio playback
 *
 * @description Hook để điều khiển player và lấy trạng thái playback
 * @uses react-native-track-player
 */

import { useState, useEffect, useCallback } from 'react';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
  Track,
} from 'react-native-track-player';
import { useAppStore, QueueItem } from '../stores/appStore';
import { ttsApi, messagesApi } from '../services/api';
import { setupPlayer } from '../services/audio';

/**
 * useAudioPlayer Hook
 *
 * @returns Object với player state và controls
 *
 * @example
 * const { isPlaying, position, duration, play, pause, skipNext } = useAudioPlayer();
 */
export function useAudioPlayer() {
  const playbackState = usePlaybackState();
  const progress = useProgress();

  const {
    queue,
    currentQueueIndex,
    ttsProvider,
    selectedVoice,
    randomVoice,
    playbackRate,
    setIsPlaying,
    updateQueueItem,
    nextInQueue,
    previousInQueue,
    decrementDialogUnread,
  } = useAppStore();

  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Current item trong queue
  const currentItem = queue[currentQueueIndex];

  // Player state
  const isPlaying = playbackState.state === State.Playing;
  const isBuffering = playbackState.state === State.Buffering;
  const isPaused = playbackState.state === State.Paused;

  // Khởi tạo player khi mount
  useEffect(() => {
    const init = async () => {
      const success = await setupPlayer();
      setIsReady(success);
    };
    init();
  }, []);

  // Sync isPlaying state với store
  useEffect(() => {
    setIsPlaying(isPlaying);
  }, [isPlaying, setIsPlaying]);

  // Cập nhật playback rate
  useEffect(() => {
    if (isReady) {
      TrackPlayer.setRate(playbackRate);
    }
  }, [playbackRate, isReady]);

  /**
   * Generate TTS và thêm vào player
   */
  const generateAndPlay = useCallback(async (item: QueueItem) => {
    if (!item || !item.message.text) return;

    setIsGenerating(true);
    updateQueueItem(item.id, { status: 'generating' });

    try {
      // Gọi TTS API
      const result = await ttsApi.synthesize(
        item.message.text,
        ttsProvider,
        selectedVoice,
        randomVoice
      );

      // Lấy stream URL
      const audioUrl = ttsApi.getStreamUrl(result.id);

      // Update queue item
      updateQueueItem(item.id, {
        status: 'ready',
        audioUrl,
      });

      // Add to track player
      const track: Track = {
        id: item.id,
        url: audioUrl,
        title: item.message.text.slice(0, 50) + (item.message.text.length > 50 ? '...' : ''),
        artist: item.message.senderName || 'Unknown',
        album: item.dialogTitle,
        duration: result.duration,
      };

      await TrackPlayer.add(track);
      await TrackPlayer.play();

      updateQueueItem(item.id, { status: 'playing' });
    } catch (error) {
      console.error('Lỗi generate TTS:', error);
      updateQueueItem(item.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [ttsProvider, selectedVoice, randomVoice, updateQueueItem]);

  /**
   * Play/Resume
   */
  const play = useCallback(async () => {
    if (!isReady) return;

    // Nếu đang pause thì resume
    if (isPaused) {
      await TrackPlayer.play();
      return;
    }

    // Nếu có current item chưa có audio thì generate
    if (currentItem && !currentItem.audioUrl) {
      await generateAndPlay(currentItem);
    } else if (currentItem?.audioUrl) {
      await TrackPlayer.play();
    }
  }, [isReady, isPaused, currentItem, generateAndPlay]);

  /**
   * Pause
   */
  const pause = useCallback(async () => {
    await TrackPlayer.pause();
  }, []);

  /**
   * Toggle Play/Pause
   */
  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  /**
   * Skip to next
   * Đánh dấu tin nhắn đã đọc và giảm unread count
   */
  const skipNext = useCallback(async () => {
    if (currentQueueIndex < queue.length - 1) {
      // Đánh dấu current là completed
      if (currentItem) {
        updateQueueItem(currentItem.id, { status: 'completed' });
        
        // F13: Đánh dấu tin nhắn đã đọc trên Telegram
        try {
          await messagesApi.markAsRead(
            currentItem.message.dialogId,
            [currentItem.message.id]
          );
          // Cập nhật unread count trong UI
          decrementDialogUnread(currentItem.message.dialogId);
          console.log('Đã đánh dấu đã đọc:', currentItem.message.id);
        } catch (error) {
          console.warn('Lỗi đánh dấu đã đọc:', error);
        }
      }

      nextInQueue();

      // Reset và play next
      await TrackPlayer.reset();

      const nextItem = queue[currentQueueIndex + 1];
      if (nextItem) {
        await generateAndPlay(nextItem);
      }
    }
  }, [currentQueueIndex, queue, currentItem, nextInQueue, updateQueueItem, generateAndPlay, decrementDialogUnread]);

  /**
   * Skip to previous
   */
  const skipPrevious = useCallback(async () => {
    if (currentQueueIndex > 0) {
      previousInQueue();

      await TrackPlayer.reset();

      const prevItem = queue[currentQueueIndex - 1];
      if (prevItem && prevItem.audioUrl) {
        await TrackPlayer.add({
          id: prevItem.id,
          url: prevItem.audioUrl,
          title: prevItem.message.text.slice(0, 50),
          artist: prevItem.message.senderName || 'Unknown',
        });
        await TrackPlayer.play();
      }
    }
  }, [currentQueueIndex, queue, previousInQueue]);

  /**
   * Seek to position
   */
  const seekTo = useCallback(async (position: number) => {
    await TrackPlayer.seekTo(position);
  }, []);

  return {
    // State
    isReady,
    isPlaying,
    isBuffering,
    isPaused,
    isGenerating,
    currentItem,
    position: progress.position,
    duration: progress.duration,
    buffered: progress.buffered,
    queueLength: queue.length,
    currentIndex: currentQueueIndex,

    // Controls
    play,
    pause,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
  };
}
