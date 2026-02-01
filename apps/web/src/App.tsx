/**
 * App - Main Application Component
 *
 * @description Layout chính của TTS Telegram Reader
 */

import { useEffect, useState } from 'react';
import { Headphones, LogOut, Play, Loader2 } from 'lucide-react';
import { useAppStore } from './stores/appStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { authApi, messagesApi } from './lib/api';
import { LoginForm } from './components/LoginForm';
import { GroupSelector } from './components/GroupSelector';
import { AudioPlayer } from './components/AudioPlayer';
import { MessageQueue } from './components/MessageQueue';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';

export default function App() {
  const {
    authStatus,
    setAuthStatus,
    selectedDialogIds,
    dialogs,
    addToQueue,
    clearQueue,
    queue,
  } = useAppStore();

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const { seekRelative, togglePlayPause } = useAudioPlayer();

  // Đăng ký keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: togglePlayPause,
    onSeek: seekRelative,
  });

  // Kiểm tra auth status khi mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { status } = await authApi.getStatus();
        setAuthStatus(status as typeof authStatus);
      } catch (error) {
        console.error('Lỗi kiểm tra auth:', error);
        setAuthStatus('awaiting_phone');
      }
    };

    checkAuth();
  }, [setAuthStatus]);

  /**
   * Lấy tin nhắn và thêm vào queue
   */
  const handleStartReading = async () => {
    if (selectedDialogIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 group');
      return;
    }

    setIsLoadingMessages(true);
    clearQueue();

    try {
      // Lấy messages từ các groups đã chọn
      const messagesData = await messagesApi.getBatchMessages(selectedDialogIds, 50);

      // Chuyển đổi thành queue items
      const queueItems = Object.entries(messagesData).flatMap(([dialogId, messages]) => {
        const dialog = dialogs.find((d) => d.id === dialogId);
        return messages.map((msg) => ({
          id: `${dialogId}-${msg.id}`,
          message: {
            id: msg.id,
            dialogId,
            text: msg.text,
            senderName: msg.senderName,
            date: new Date(msg.date),
            isOutgoing: msg.isOutgoing,
          },
          dialogTitle: dialog?.title || 'Unknown',
          status: 'pending' as const,
        }));
      });

      // Sắp xếp theo thời gian (mới nhất trước)
      queueItems.sort((a, b) => b.message.date.getTime() - a.message.date.getTime());

      addToQueue(queueItems);
    } catch (error) {
      console.error('Lỗi lấy messages:', error);
      alert('Không thể lấy tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  /**
   * Đăng xuất
   */
  const handleLogout = async () => {
    try {
      await authApi.logout();
      setAuthStatus('awaiting_phone');
      clearQueue();
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface-light bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TTS Telegram Reader</h1>
              <p className="text-xs text-gray-400">Đọc tin nhắn Telegram bằng giọng nói</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <KeyboardShortcutsHelp />

            {authStatus === 'connected' && (
              <button
                onClick={handleLogout}
                className="btn-ghost text-sm text-gray-400 hover:text-error"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Đăng xuất
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {authStatus !== 'connected' ? (
          // Login Screen
          <div className="max-w-md mx-auto py-12">
            <LoginForm />
          </div>
        ) : (
          // Main App
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Group Selector */}
            <div className="lg:col-span-1 h-[calc(100vh-200px)]">
              <GroupSelector />
            </div>

            {/* Right Column: Player & Queue */}
            <div className="lg:col-span-2 space-y-6">
              {/* Start Reading Button */}
              <button
                onClick={handleStartReading}
                disabled={selectedDialogIds.length === 0 || isLoadingMessages}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
              >
                {isLoadingMessages ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Đang tải tin nhắn...
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    Bắt đầu đọc ({selectedDialogIds.length} groups)
                  </>
                )}
              </button>

              {/* Audio Player */}
              <AudioPlayer />

              {/* Message Queue */}
              <div className="h-[calc(100vh-500px)]">
                <MessageQueue />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-light py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            TTS Telegram Reader • Made with ❤️ •{' '}
            <a
              href="https://my.telegram.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Telegram API
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
