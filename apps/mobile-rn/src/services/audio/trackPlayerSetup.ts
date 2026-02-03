/**
 * Track Player Setup - Khởi tạo và cấu hình react-native-track-player
 *
 * @description Setup player với capabilities cho lock screen controls
 */

import TrackPlayer, {
  Capability,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';

let isPlayerInitialized = false;

/**
 * Setup Track Player
 *
 * @description Khởi tạo player với các capabilities:
 * - Play/Pause
 * - Skip Next/Previous
 * - Seek
 *
 * @returns Promise<boolean> - true nếu setup thành công
 */
export async function setupPlayer(): Promise<boolean> {
  if (isPlayerInitialized) {
    return true;
  }

  try {
    await TrackPlayer.setupPlayer({
      // Chờ buffer trước khi phát
      waitForBuffer: true,
    });

    await TrackPlayer.updateOptions({
      // Android: Tiếp tục phát khi app bị kill
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },

      // Capabilities hiển thị trên lock screen
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],

      // Compact capabilities (Android notification)
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],

      // Notification capabilities
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
    });

    isPlayerInitialized = true;
    console.log('Track Player đã khởi tạo thành công');
    return true;
  } catch (error) {
    console.error('Lỗi khởi tạo Track Player:', error);
    return false;
  }
}

/**
 * Reset Player
 *
 * @description Dọn dẹp player khi cần
 */
export async function resetPlayer(): Promise<void> {
  try {
    await TrackPlayer.reset();
  } catch (error) {
    console.error('Lỗi reset player:', error);
  }
}

/**
 * Check xem player đã khởi tạo chưa
 */
export function isPlayerReady(): boolean {
  return isPlayerInitialized;
}
