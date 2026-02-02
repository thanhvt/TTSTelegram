# Mobile Architecture - TTS Telegram Reader

> **Kiến trúc kỹ thuật cho ứng dụng mobile React Native**

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MOBILE APP (React Native + Expo)            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Screens   │  │    Hooks    │  │    Store    │  │   Services  │ │
│  │  (UI/UX)    │──│  (Logic)    │──│  (Zustand)  │──│  (API/TTS)  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Navigation (React Navigation)            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         │                                                           │
│         ▼                                                           │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────┐ │
│  │  expo-av      │  │ expo-secure   │  │ react-native-track-player│ │
│  │  (Audio)      │  │ -store        │  │ (Background Audio)      │ │
│  └───────────────┘  └───────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (apps/api)                          │
│  Express.js + GramJS + TTS Services                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Project Structure

```
apps/mobile/
├── app.json                 # Expo config
├── App.tsx                  # Entry point
├── src/
│   ├── screens/             # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── GroupsScreen.tsx
│   │   ├── PlayerScreen.tsx
│   │   └── SettingsScreen.tsx
│   │
│   ├── components/          # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── audio/
│   │   │   ├── PlayerControls.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── NowPlaying.tsx
│   │   └── dialogs/
│   │       ├── DialogItem.tsx
│   │       ├── DialogList.tsx
│   │       └── GroupSelector.tsx
│   │
│   ├── navigation/          # React Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   │
│   ├── stores/              # Zustand stores
│   │   ├── appStore.ts      # Main app state
│   │   ├── authStore.ts     # Auth state
│   │   └── playerStore.ts   # Player state
│   │
│   ├── services/            # API & external services
│   │   ├── api/
│   │   │   ├── client.ts    # Axios/fetch wrapper
│   │   │   ├── auth.ts
│   │   │   ├── dialogs.ts
│   │   │   ├── messages.ts
│   │   │   └── tts.ts
│   │   ├── audio/
│   │   │   └── trackPlayer.ts
│   │   └── storage/
│   │       └── secureStore.ts
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── useAudioPlayer.ts
│   │   ├── useAuth.ts
│   │   └── useQueue.ts
│   │
│   ├── utils/               # Utilities
│   │   ├── formatters.ts
│   │   └── constants.ts
│   │
│   └── theme/               # Theme config
│       ├── colors.ts
│       ├── typography.ts
│       └── index.ts
│
├── assets/                  # Static assets
│   ├── images/
│   └── fonts/
│
└── package.json
```

---

## 2. State Management (Zustand)

### 2.1. Store Structure

```typescript
// src/stores/appStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types (share with web via packages/shared)
interface AppState {
  // Auth
  authStatus: AuthStatus;
  sessionString: string;
  
  // Dialogs
  dialogs: Dialog[];
  selectedDialogIds: string[];
  
  // Queue
  queue: QueueItem[];
  currentQueueIndex: number;
  
  // Player
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  
  // Settings
  ttsProvider: TTSProvider;
  selectedVoice: string;
  theme: ThemeType;
  
  // Actions...
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state & actions
    }),
    {
      name: 'tts-telegram-mobile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist only necessary fields
        selectedDialogIds: state.selectedDialogIds,
        ttsProvider: state.ttsProvider,
        selectedVoice: state.selectedVoice,
        theme: state.theme,
        volume: state.volume,
        playbackRate: state.playbackRate,
      }),
    }
  )
);
```

### 2.2. Auth Store (Separate for Security)

```typescript
// src/stores/authStore.ts
import * as SecureStore from 'expo-secure-store';

// Session stored in SecureStore, not AsyncStorage
const SESSION_KEY = 'telegram_session';

export const authStore = {
  async getSession() {
    return await SecureStore.getItemAsync(SESSION_KEY);
  },
  
  async setSession(session: string) {
    await SecureStore.setItemAsync(SESSION_KEY, session);
  },
  
  async clearSession() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};
```

---

## 3. Navigation Architecture

```typescript
// src/navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const authStatus = useAppStore((s) => s.authStatus);
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authStatus !== 'connected' ? (
          // Auth flow
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // Main app
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen 
              name="Player" 
              component={PlayerScreen}
              options={{ 
                presentation: 'modal',
                gestureEnabled: true 
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Navigation Flow

```
                    App Start
                       │
                       ▼
              ┌─────────────────┐
              │ Check Session   │
              └─────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    ┌──────────┐             ┌──────────────┐
    │  Login   │             │   MainTabs   │
    │  Screen  │             │              │
    └──────────┘             └──────────────┘
          │                         │
          │                    ┌────┴────┐
          │                    ▼         ▼
          │              ┌─────────┐ ┌───────────┐
          │              │ Groups  │ │ Settings  │
          │              └─────────┘ └───────────┘
          │                    │
          │                    ▼
          │              ┌───────────┐
          └─────────────>│  Player   │
                         │  (Modal)  │
                         └───────────┘
```

---

## 4. API Layer

### 4.1. API Client

```typescript
// src/services/api/client.ts
import { authStore } from '@/stores/authStore';

const API_BASE = 'https://api.tts-telegram.com'; // hoặc localhost dev

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await authStore.getSession();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session && { Authorization: `Bearer ${session}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }
  
  return response.json();
}
```

### 4.2. React Query Integration

```typescript
// src/hooks/useDialogs.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { dialogsApi } from '@/services/api/dialogs';

export function useDialogs() {
  return useQuery({
    queryKey: ['dialogs'],
    queryFn: dialogsApi.getAll,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function useMessages(dialogId: string) {
  return useQuery({
    queryKey: ['messages', dialogId],
    queryFn: () => messagesApi.getByDialog(dialogId),
    enabled: !!dialogId,
  });
}
```

---

## 5. Audio System

### 5.1. Track Player Setup

```typescript
// src/services/audio/trackPlayer.ts
import TrackPlayer, { 
  Capability,
  Event,
  RepeatMode 
} from 'react-native-track-player';

export async function setupPlayer() {
  await TrackPlayer.setupPlayer({
    waitForBuffer: true,
  });
  
  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
    ],
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
    ],
  });
}

// Background service handler
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    // Custom next logic
  });
}
```

### 5.2. Audio Player Hook

```typescript
// src/hooks/useAudioPlayer.ts
export function useAudioPlayer() {
  const { queue, currentIndex, updateQueueItem } = useAppStore();
  const { isPlaying, position, duration } = useProgress();
  
  const currentItem = queue[currentIndex];
  
  const play = async () => {
    if (!currentItem?.audioUrl) {
      // Generate TTS first
      const result = await ttsApi.synthesize(currentItem.message.text);
      const audioUrl = ttsApi.getStreamUrl(result.id);
      
      await TrackPlayer.add({
        id: currentItem.id,
        url: audioUrl,
        title: currentItem.dialogTitle,
        artist: currentItem.message.senderName,
      });
    }
    
    await TrackPlayer.play();
  };
  
  return {
    isPlaying,
    position,
    duration,
    currentItem,
    play,
    pause: TrackPlayer.pause,
    seekTo: TrackPlayer.seekTo,
    skipToNext,
    skipToPrevious,
  };
}
```

---

## 6. Secure Storage Pattern

```typescript
// src/services/storage/secureStore.ts
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  SESSION: 'telegram_session',
  PHONE: 'last_phone',
} as const;

export const secureStorage = {
  // Session management
  async saveSession(session: string) {
    await SecureStore.setItemAsync(KEYS.SESSION, session);
  },
  
  async getSession() {
    return await SecureStore.getItemAsync(KEYS.SESSION);
  },
  
  async clearSession() {
    await SecureStore.deleteItemAsync(KEYS.SESSION);
  },
  
  // Phone number (less sensitive)
  async savePhone(phone: string) {
    await SecureStore.setItemAsync(KEYS.PHONE, phone);
  },
  
  async getPhone() {
    return await SecureStore.getItemAsync(KEYS.PHONE);
  },
};
```

---

## 7. Theme System

```typescript
// src/theme/colors.ts
export const themes = {
  'ocean-calm': {
    primary: '#0D9488',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    accent: '#14B8A6',
  },
  'midnight-audio': {
    primary: '#8B5CF6',
    background: '#1E1B4B',
    surface: '#312E81',
    text: '#F8FAFC',
    textSecondary: '#A5B4FC',
    accent: '#A78BFA',
  },
  // ... other themes
};

// Usage with hook
export function useTheme() {
  const themeName = useAppStore((s) => s.theme);
  return themes[themeName];
}
```

---

## 8. Error Handling Strategy

```typescript
// src/services/api/errorHandler.ts
import { Alert } from 'react-native';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`API Error: ${status}`);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        // Session expired - trigger re-auth
        authStore.clearSession();
        break;
      case 429:
        Alert.alert('Quá nhiều yêu cầu', 'Vui lòng thử lại sau');
        break;
      default:
        Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
    }
  }
}
```

---

## 9. Performance Considerations

### 9.1. List Optimization

```typescript
// Dialogs list with FlatList + memo
const DialogItem = React.memo(({ dialog, onSelect }) => (
  <Pressable onPress={() => onSelect(dialog.id)}>
    <Text>{dialog.title}</Text>
  </Pressable>
));

const renderItem = useCallback(
  ({ item }) => <DialogItem dialog={item} onSelect={handleSelect} />,
  [handleSelect]
);

<FlatList
  data={dialogs}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  getItemLayout={(_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### 9.2. Background Audio Battery

```typescript
// Avoid frequent updates
const progressUpdateEvent = useTrackPlayerEvents(
  [Event.PlaybackActiveTrackChanged],
  async (event) => {
    // Only update on track change, not every second
  }
);
```

---

## 10. Testing Strategy

| Layer | Tool | What to Test |
|-------|------|--------------|
| Unit | Jest | Stores, utils, formatters |
| Component | React Native Testing Library | UI components |
| Integration | Jest + MSW | API calls, hooks |
| E2E | Detox | Full user flows |

---

> **Tài liệu liên quan:**
> - [mobile-requirements.md](./mobile-requirements.md)
> - [mobile-features.md](./mobile-features.md)
> - [mobile-api-integration.md](./mobile-api-integration.md)
