/**
 * useAudioPlayer - Hook quản lý audio playback
 *
 * @description Sử dụng Howler.js để phát audio
 * @usage Gọi trong component AudioPlayer
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { useAppStore } from '../stores/appStore';
import { ttsApi } from '../lib/api';

export function useAudioPlayer() {
  const howlRef = useRef<Howl | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const {
    isPlaying,
    setIsPlaying,
    volume,
    playbackRate,
    queue,
    currentQueueIndex,
    updateQueueItem,
    nextInQueue,
    selectedVoice,
    randomVoice,
  } = useAppStore();

  const currentItem = queue[currentQueueIndex];

  /**
   * Load và phát audio từ URL
   */
  const playAudio = useCallback(
    (audioUrl: string) => {
      // Dừng audio hiện tại nếu có
      if (howlRef.current) {
        howlRef.current.unload();
      }

      setIsLoading(true);

      const howl = new Howl({
        src: [audioUrl],
        format: ['mp3'], // Chỉ định format để Howler.js nhận diện đúng
        html5: true,
        volume: volume,
        rate: playbackRate,
        onload: () => {
          setDuration(howl.duration());
          setIsLoading(false);
        },
        onplay: () => {
          setIsPlaying(true);
          // Update progress
          const updateProgress = () => {
            if (howlRef.current && howlRef.current.playing()) {
              setCurrentTime(howlRef.current.seek() as number);
              requestAnimationFrame(updateProgress);
            }
          };
          requestAnimationFrame(updateProgress);
        },
        onpause: () => {
          setIsPlaying(false);
        },
        onend: () => {
          setIsPlaying(false);
          setCurrentTime(0);
          // Chuyển sang tin nhắn tiếp theo
          if (currentItem) {
            updateQueueItem(currentItem.id, { status: 'completed' });
          }
          // Tự động chuyển sang item tiếp theo
          nextInQueue();
        },
        onloaderror: (_id, error) => {
          console.error('Lỗi load audio:', error);
          setIsLoading(false);
          if (currentItem) {
            updateQueueItem(currentItem.id, { status: 'error', error: 'Không thể load audio' });
          }
          // Khi lỗi, tự động chuyển sang item tiếp theo
          nextInQueue();
        },
      });

      howl.play();
      howlRef.current = howl;
    },
    [volume, playbackRate, currentItem, updateQueueItem, nextInQueue, setIsPlaying]
  );

  /**
   * Tạo audio cho item hiện tại nếu chưa có
   * Sử dụng voice và randomVoice từ store settings
   */
  const generateAndPlay = useCallback(async () => {
    if (!currentItem) return;

    // Nếu đã có audio URL thì phát luôn
    if (currentItem.audioUrl) {
      playAudio(currentItem.audioUrl);
      updateQueueItem(currentItem.id, { status: 'playing' });
      return;
    }

    // Tạo audio mới với voice settings
    try {
      updateQueueItem(currentItem.id, { status: 'generating' });
      setIsLoading(true);

      const result = await ttsApi.synthesize({
        text: currentItem.message.text,
        voice: selectedVoice,
        randomVoice: randomVoice,
      });
      const audioUrl = ttsApi.getStreamUrl(result.id);

      // Log voice được sử dụng nếu random mode
      if (randomVoice && result.voiceUsed) {
        console.log(`🎲 Giọng ngẫu nhiên: ${result.voiceUsed}`);
      }

      updateQueueItem(currentItem.id, { audioUrl, status: 'ready' });
      playAudio(audioUrl);
      updateQueueItem(currentItem.id, { status: 'playing' });
    } catch (error) {
      console.error('Lỗi tạo audio:', error);
      updateQueueItem(currentItem.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Không thể tạo audio',
      });
      setIsLoading(false);
    }
  }, [currentItem, playAudio, updateQueueItem, selectedVoice, randomVoice]);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (!howlRef.current) {
      // Chưa có audio, tạo mới
      generateAndPlay();
      return;
    }

    if (isPlaying) {
      howlRef.current.pause();
    } else {
      howlRef.current.play();
    }
  }, [isPlaying, generateAndPlay]);

  /**
   * Seek đến vị trí cụ thể
   */
  const seek = useCallback((time: number) => {
    if (howlRef.current) {
      howlRef.current.seek(time);
      setCurrentTime(time);
    }
  }, []);

  /**
   * Seek tương đối (rewind/forward)
   */
  const seekRelative = useCallback(
    (seconds: number) => {
      if (howlRef.current) {
        const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
        seek(newTime);
      }
    },
    [currentTime, duration, seek]
  );

  /**
   * Dừng hoàn toàn
   */
  const stop = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [setIsPlaying]);

  // Cập nhật volume khi thay đổi
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(volume);
    }
  }, [volume]);

  // Cập nhật playback rate khi thay đổi
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.rate(playbackRate);
    }
  }, [playbackRate]);

  /**
   * Auto-play khi chuyển sang item mới
   * CHÚ Ý: Chỉ trigger khi index thay đổi, KHÔNG trigger khi status thay đổi
   * để tránh race condition với generateAndPlay()
   */
  useEffect(() => {
    if (!currentItem) return;
    
    // QUAN TRỌNG: Không trigger nếu đang generating hoặc playing
    // vì generateAndPlay() đã handle việc phát audio
    if (currentItem.status === 'generating' || currentItem.status === 'playing') {
      return;
    }
    
    // Nếu item đã có audio và status là 'ready' (được set từ trước, không phải từ generateAndPlay)
    // Trường hợp này xảy ra khi user quay lại item đã phát trước đó
    if (currentItem.audioUrl && currentItem.status === 'completed') {
      playAudio(currentItem.audioUrl);
      updateQueueItem(currentItem.id, { status: 'playing' });
      return;
    }
    
    // Nếu item chưa có audio và chưa generating, tự động generate
    if (currentItem.status === 'pending') {
      generateAndPlay();
    }
  }, [currentQueueIndex, currentItem?.id]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
      }
    };
  }, []);

  return {
    isPlaying,
    isLoading,
    currentTime,
    duration,
    currentItem,
    togglePlayPause,
    seek,
    seekRelative,
    stop,
    generateAndPlay,
  };
}
