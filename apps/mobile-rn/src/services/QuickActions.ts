/**
 * Quick Actions Service - Xử lý iOS Quick Actions (3D Touch) và Android Shortcuts
 *
 * @description Service xử lý deep links từ app quick actions
 * @flow User long press app icon → Chọn action → App xử lý và navigate
 */

import { Linking, Platform } from 'react-native';

// ============================================
// TYPES
// ============================================

export type QuickActionType = 'play' | 'groups' | 'settings';

export interface QuickActionHandler {
  onPlay: () => void;
  onGroups: () => void;
  onSettings: () => void;
}

// ============================================
// QUICK ACTIONS CONFIG
// ============================================

/**
 * Danh sách Quick Actions cho iOS
 * Được cấu hình trong Info.plist
 */
export const QUICK_ACTIONS = {
  play: {
    type: 'play',
    title: '▶️ Tiếp tục phát',
    subtitle: 'Phát audio đang dừng',
  },
  groups: {
    type: 'groups',
    title: '📋 Chọn Groups',
    subtitle: 'Chọn nhóm để đọc',
  },
  settings: {
    type: 'settings',
    title: '⚙️ Cài đặt',
    subtitle: 'Thay đổi cấu hình',
  },
} as const;

// ============================================
// HANDLERS
// ============================================

/**
 * Xử lý quick action từ URL scheme
 *
 * @param url - URL scheme từ Linking (e.g., "ttstelegram://play")
 * @param handlers - Object chứa các handler functions
 *
 * @example
 * handleQuickAction('ttstelegram://play', {
 *   onPlay: () => navigation.navigate('Player'),
 *   onGroups: () => navigation.navigate('Groups'),
 *   onSettings: () => navigation.navigate('Settings'),
 * });
 */
export function handleQuickAction(url: string, handlers: QuickActionHandler): void {
  if (!url) return;

  try {
    // Parse URL để lấy action type
    const actionMatch = url.match(/ttstelegram:\/\/(\w+)/);
    if (!actionMatch) return;

    const actionType = actionMatch[1] as QuickActionType;

    console.log('Xử lý Quick Action:', actionType);

    switch (actionType) {
      case 'play':
        handlers.onPlay();
        break;
      case 'groups':
        handlers.onGroups();
        break;
      case 'settings':
        handlers.onSettings();
        break;
      default:
        console.warn('Quick Action không xác định:', actionType);
    }
  } catch (error) {
    console.error('Lỗi xử lý Quick Action:', error);
  }
}

/**
 * Đăng ký listener cho deep links
 *
 * @param handlers - Object chứa các handler functions
 * @returns Cleanup function để unsubscribe
 */
export function subscribeToQuickActions(handlers: QuickActionHandler): () => void {
  // Xử lý URL khi app được mở từ cold start
  const handleInitialUrl = async () => {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      handleQuickAction(initialUrl, handlers);
    }
  };

  handleInitialUrl();

  // Xử lý URL khi app đang chạy (warm start)
  const subscription = Linking.addEventListener('url', (event) => {
    handleQuickAction(event.url, handlers);
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
}
