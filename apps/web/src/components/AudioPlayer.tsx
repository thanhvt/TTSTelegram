/**
 * AudioPlayer - Component điều khiển phát audio
 *
 * @description Hiển thị player với controls, progress bar, volume
 */

import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Gauge,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

/**
 * Format thời gian thành mm:ss
 * @param seconds - số giây
 * @returns chuỗi định dạng mm:ss
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format ngày giờ tin nhắn
 * @param date - ngày giờ của tin nhắn
 * @returns chuỗi định dạng "dd/mm HH:mm" hoặc "Hôm nay HH:mm"
 */
function formatMessageDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  
  if (messageDay.getTime() === today.getTime()) {
    return `Hôm nay ${time}`;
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDay.getTime() === yesterday.getTime()) {
    return `Hôm qua ${time}`;
  }
  
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${time}`;
}

export function AudioPlayer() {
  const {
    volume,
    setVolume,
    playbackRate,
    setPlaybackRate,
    queue,
    currentQueueIndex,
    nextInQueue,
    previousInQueue,
  } = useAppStore();

  // QUAN TRỌNG: Chỉ AudioPlayer được phép enableAutoPlay = true
  // để tránh multiple instances trigger generateAndPlay()
  const {
    isPlaying,
    isLoading,
    currentTime,
    duration,
    currentItem,
    togglePlayPause,
    seek,
  } = useAudioPlayer({ enableAutoPlay: true });

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Không có gì trong queue
  if (queue.length === 0) {
    return (
      <div className="card bg-gradient-to-r from-surface to-surface-light">
        <div className="text-center py-6 text-gray-400">
          <p className="text-lg">🎧 Chưa có tin nhắn nào trong queue</p>
          <p className="text-sm mt-2">Chọn groups và bấm "Bắt đầu đọc" để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-gradient-to-r from-surface to-surface-light">
      {/* Now Playing Info */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          {/* Audio Wave Animation */}
          {isPlaying && (
            <div className="audio-wave">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-400">
              Đang phát: {currentQueueIndex + 1} / {queue.length}
            </div>
            <div className="font-medium text-white truncate">
              {currentItem?.dialogTitle || 'Unknown'}
            </div>
            {/* Thông tin người post và thời gian */}
            {currentItem && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span className="text-primary/80 font-medium">
                  {currentItem.message.senderName || 'Unknown'}
                </span>
                <span>•</span>
                <span>{formatMessageDate(currentItem.message.date)}</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div
            className={`px-2 py-1 rounded text-xs font-medium ${
              currentItem?.status === 'generating'
                ? 'bg-warning/20 text-warning'
                : currentItem?.status === 'error'
                ? 'bg-error/20 text-error'
                : currentItem?.status === 'playing'
                ? 'bg-success/20 text-success'
                : 'bg-surface-light text-gray-400'
            }`}
          >
            {currentItem?.status === 'generating' && 'Đang tạo audio...'}
            {currentItem?.status === 'error' && 'Lỗi'}
            {currentItem?.status === 'playing' && 'Đang phát'}
            {currentItem?.status === 'ready' && 'Sẵn sàng'}
            {currentItem?.status === 'pending' && 'Chờ'}
          </div>
        </div>

        {/* Message Preview */}
        {currentItem && (
          <div className="mt-2 p-3 bg-background/50 rounded-lg">
            <p className="text-sm text-gray-300 overflow-y-auto max-h-32 whitespace-pre-wrap">{currentItem.message.text}</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4 group select-none">
        <div
          className="relative h-3 bg-surface-light rounded-full cursor-pointer touch-none"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            seek(percent * duration);
          }}
        >
          {/* Progress Fill */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-100 will-change-[width]"
            style={{ width: `${progress}%` }}
          >
            {/* Glow Animation */}
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            
            {/* Indicator Knob - Always visible per user request */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-5 h-5 bg-white border-2 border-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)] z-10 transform transition-transform hover:scale-110" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Previous */}
        <button
          onClick={previousInQueue}
          disabled={currentQueueIndex === 0}
          className="btn-ghost p-3 disabled:opacity-30"
          title="Tin trước (P)"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="btn-primary p-4 rounded-full"
          title="Play/Pause (Space)"
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={nextInQueue}
          disabled={currentQueueIndex >= queue.length - 1}
          className="btn-ghost p-3 disabled:opacity-30"
          title="Tin tiếp (N)"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>

      {/* Volume & Speed Controls */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-light">
        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
            className="btn-ghost p-1"
            title="Mute (M)"
          >
            {volume === 0 ? (
              <VolumeX className="w-5 h-5 text-gray-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-primary"
          />
          <span className="text-xs text-gray-500 w-8">{Math.round(volume * 100)}%</span>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-gray-400" />
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="bg-surface-light text-white text-sm px-2 py-1 rounded border-none focus:ring-1 focus:ring-primary"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
