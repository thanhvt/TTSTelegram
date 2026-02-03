/**
 * Track Player Service - Background audio service cho react-native-track-player
 *
 * @description Xử lý các events từ lock screen và notification controls
 * @uses Được register trong App entry point
 */

import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * Playback Service - Background handler cho audio events
 *
 * @description Xử lý các remote events:
 * - RemotePlay: Từ lock screen/notification
 * - RemotePause: Từ lock screen/notification
 * - RemoteNext: Skip to next track
 * - RemotePrevious: Skip to previous track
 * - RemoteSeek: Seek to position
 */
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    console.log('Remote Play triggered');
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    console.log('Remote Pause triggered');
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    console.log('Remote Next triggered');
    TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    console.log('Remote Previous triggered');
    TrackPlayer.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    console.log('Remote Seek triggered:', event.position);
    TrackPlayer.seekTo(event.position);
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    console.log('Remote Stop triggered');
    TrackPlayer.stop();
  });
}
