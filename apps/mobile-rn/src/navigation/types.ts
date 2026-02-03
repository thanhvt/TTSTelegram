/**
 * Navigation Types - Định nghĩa các params cho navigation
 *
 * @description Type-safe navigation cho React Navigation
 */

// Root Stack - Auth flow và Main app
export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  OTP: { phoneNumber: string };
  TwoFA: { phoneNumber: string; code: string };

  // Main app
  MainTabs: undefined;
  Player: undefined;
};

// Bottom Tabs trong Main app
export type MainTabParamList = {
  Groups: undefined;
  Queue: undefined;
  Settings: undefined;
};

// Declaration merge để navigation biết types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
