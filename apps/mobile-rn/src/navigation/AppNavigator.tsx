/**
 * App Navigator - Root navigation cho ứng dụng
 *
 * @description Quản lý flow: Auth → Main → Player
 * @uses React Navigation với conditional rendering dựa trên auth status
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAppStore } from '../stores/appStore';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList, MainTabParamList } from './types';

// Screens
import LoginScreen from '../screens/LoginScreen';
import OTPScreen from '../screens/OTPScreen';
import TwoFAScreen from '../screens/TwoFAScreen';
import GroupsScreen from '../screens/GroupsScreen';
import QueueScreen from '../screens/QueueScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PlayerScreen from '../screens/PlayerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Tab Bar Icon Component
 */
function TabIcon({ icon, focused, color }: { icon: string; focused: boolean; color: string }) {
  return <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>{icon}</Text>;
}

/**
 * Main Tab Navigator - Tab bar với Groups, Queue, Settings
 */
function MainTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarLabel: 'Groups',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="👥" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Queue"
        component={QueueScreen}
        options={{
          tabBarLabel: 'Queue',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="📋" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Cài đặt',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="⚙️" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * App Navigator - Root navigator
 *
 * @description Điều hướng dựa trên authStatus:
 * - disconnected/awaiting_* → Auth screens
 * - connected → Main tabs + Player modal
 */
export default function AppNavigator() {
  const authStatus = useAppStore((state) => state.authStatus);
  const theme = useTheme();

  const isAuthenticated = authStatus === 'connected';

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          notification: theme.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="TwoFA" component={TwoFAScreen} />
          </>
        ) : (
          // Main App
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="Player"
              component={PlayerScreen}
              options={{
                presentation: 'modal',
                gestureEnabled: true,
                animation: 'slide_from_bottom',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
