/**
 * App Entry Point - TTS Telegram Reader Mobile
 *
 * @description Root component setup với providers và Track Player
 * @uses React Query, Zustand, React Navigation, react-native-track-player
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TrackPlayer from 'react-native-track-player';
import AppNavigator from './src/navigation/AppNavigator';
import { useAppStore } from './src/stores/appStore';
import { authStore } from './src/stores/authStore';
import { authApi } from './src/services/api';
import { setupPlayer, PlaybackService } from './src/services/audio';
import { themes } from './src/theme';

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 giây
      retry: 2,
    },
  },
});

// Register Track Player service - phải ở ngoài component
TrackPlayer.registerPlaybackService(() => PlaybackService);

/**
 * Session & Player Initializer - Restore session và setup player
 */
function AppInitializer({ children }: { children: React.ReactNode }) {
  const { setAuthStatus, theme } = useAppStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const themeColors = themes[theme];

  useEffect(() => {
    const initialize = async () => {
      try {
        // Setup Track Player
        await setupPlayer();

        // Restore session
        const hasSession = await authStore.hasSession();

        if (hasSession) {
          const sessionString = await authStore.getSession();
          if (sessionString) {
            try {
              const isValid = await authApi.restoreSession(sessionString);
              if (isValid) {
                setAuthStatus('connected');
              } else {
                await authStore.clearSession();
                setAuthStatus('disconnected');
              }
            } catch {
              // Server không khả dụng, vẫn đánh dấu connected
              // để user có thể dùng offline features sau này
              setAuthStatus('connected');
            }
          }
        }
      } catch (error) {
        console.error('Lỗi khởi tạo app:', error);
        setAuthStatus('disconnected');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [setAuthStatus]);

  if (isInitializing) {
    return (
      <View style={[styles.loading, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * App Component - Root của ứng dụng
 */
export default function App() {
  const theme = useAppStore((state) => state.theme);
  const themeColors = themes[theme];
  const isDarkTheme = theme !== 'fintech-trust';

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar
        barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />
      <AppInitializer>
        <AppNavigator />
      </AppInitializer>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
