/**
 * TTS Telegram Reader - Index Entry Point
 *
 * @description Đăng ký App component và TrackPlayer service
 */

import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { name as appName } from './app.json';
import { PlaybackService } from './src/services/audio/trackPlayerService';

// Đăng ký main component
AppRegistry.registerComponent(appName, () => App);

// Đăng ký TrackPlayer playback service (chạy trong background)
TrackPlayer.registerPlaybackService(() => PlaybackService);
