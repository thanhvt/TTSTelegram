/**
 * TTS Telegram Reader - React Native CLI Entry Point
 *
 * @description Main App component với navigation và providers
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TrackPlayer from 'react-native-track-player';
import AppNavigator from './src/navigation/AppNavigator';
import { authStore } from './src/stores/authStore';
import { useAppStore } from './src/stores/appStore';
import { setupPlayer } from './src/services/audio/trackPlayerSetup';
import { useTheme } from './src/hooks/useTheme';
import { subscribeToQuickActions } from './src/services/QuickActions';

// Tạo QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
});

/**
 * App Initializer - Khôi phục session, setup player, và xử lý Quick Actions
 */
function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const setAuthStatus = useAppStore((state) => state.setAuthStatus);
  const theme = useTheme();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Khôi phục session từ Keychain
        const hasSession = await authStore.hasSession();
        if (hasSession) {
          setAuthStatus('connected');
        }

        // Setup Track Player
        await setupPlayer();
      } catch (error) {
        console.error('Lỗi khởi tạo app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [setAuthStatus]);

  // F33: Subscribe to Quick Actions
  useEffect(() => {
    const unsubscribe = subscribeToQuickActions({
      onPlay: () => {
        // Navigate to Player và play
        console.log('Quick Action: Play');
        // Navigation sẽ được xử lý qua deep link
      },
      onGroups: () => {
        console.log('Quick Action: Groups');
      },
      onSettings: () => {
        console.log('Quick Action: Settings');
      },
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Main App Component
 */
function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
            <AppInitializer>
              <AppNavigator />
            </AppInitializer>
          </QueryClientProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
