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
import { TTSSettings } from './components/TTSSettings';
import { TTSStatusBadge } from './components/TTSStatusBadge';

export default function App() {
  const {
    authStatus,
    setAuthStatus,
    selectedDialogIds,
    dialogs,
    addToQueue,
    clearQueue,
    sessionString,
    clearSessionString,
  } = useAppStore();

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const { seekRelative, togglePlayPause } = useAudioPlayer();

  // Đăng ký keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: togglePlayPause,
    onSeek: seekRelative,
  });

  /**
   * Kiểm tra auth status và tự động khôi phục session từ localStorage
   * @description Chạy khi app mount. Nếu có sessionString đã lưu, gửi lên server để restore
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Bước 1: Kiểm tra status hiện tại từ server
        const { status } = await authApi.getStatus();
        
        // Nếu đã connected thì không cần restore
        if (status === 'connected') {
          setAuthStatus(status as typeof authStatus);
          return;
        }

        // Bước 2: Nếu chưa connected nhưng có session đã lưu, thử restore
        if (sessionString) {
          console.log('🔄 Đang khôi phục session từ localStorage...');
          setIsRestoringSession(true);
          
          try {
            const { restored } = await authApi.restoreSession(sessionString);
            
            if (restored) {
              console.log('✅ Khôi phục session thành công! Không cần đăng nhập lại.');
              setAuthStatus('connected');
            } else {
              console.log('⚠️ Session hết hạn, cần đăng nhập lại');
              clearSessionString(); // Xóa session không còn hợp lệ
              setAuthStatus('awaiting_phone');
            }
          } catch (restoreError) {
            console.error('❌ Lỗi khôi phục session:', restoreError);
            clearSessionString();
            setAuthStatus('awaiting_phone');
          } finally {
            setIsRestoringSession(false);
          }
        } else {
          // Không có session đã lưu
          setAuthStatus(status as typeof authStatus);
        }
      } catch (error) {
        console.error('Lỗi kiểm tra auth:', error);
        setAuthStatus('awaiting_phone');
      }
    };

    checkAuth();
  }, [setAuthStatus, sessionString, clearSessionString]);

  /**
   * Lấy tin nhắn và thêm vào queue
   * Sử dụng unreadCount của mỗi group làm limit để chỉ lấy tin nhắn chưa đọc
   */
  const handleStartReading = async () => {
    if (selectedDialogIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 group');
      return;
    }

    setIsLoadingMessages(true);
    clearQueue();

    try {
      // Xác định limit dựa trên unreadCount của mỗi dialog
      const dialogLimits = selectedDialogIds.map(id => {
        const dialog = dialogs.find(d => d.id === id);
        // Sử dụng unreadCount, tối thiểu 1, tối đa 100
        return Math.min(Math.max(dialog?.unreadCount || 10, 1), 100);
      });

      // Tính tổng limit (để log)
      const totalUnread = dialogLimits.reduce((sum, l) => sum + l, 0);
      console.log(`📱 Đang lấy ${totalUnread} tin nhắn chưa đọc từ ${selectedDialogIds.length} groups`);

      // Lấy messages từ các groups đã chọn
      // Sử dụng max của các limits làm batch limit (API sẽ giới hạn)
      const maxLimit = Math.max(...dialogLimits);
      const messagesData = await messagesApi.getBatchMessages(selectedDialogIds, maxLimit);

      // Chuyển đổi thành queue items, lọc theo unreadCount
      const queueItems = Object.entries(messagesData).flatMap(([dialogId, messages]) => {
        const dialog = dialogs.find((d) => d.id === dialogId);
        const unreadLimit = dialog?.unreadCount || messages.length;
        
        // Chỉ lấy số tin nhắn bằng unreadCount (tin mới nhất)
        const limitedMessages = messages.slice(0, unreadLimit);
        
        return limitedMessages.map((msg) => ({
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

      // Sắp xếp theo thời gian (cũ nhất trước)
      queueItems.sort((a, b) => a.message.date.getTime() - b.message.date.getTime());

      console.log(`📊 API response: ${Object.values(messagesData).flat().length} tin nhắn`);
      console.log(`📋 Queue: ${queueItems.length} tin nhắn sau khi filter theo unreadCount`);
      addToQueue(queueItems);
    } catch (error) {
      console.error('Lỗi lấy messages:', error);
      alert('Không thể lấy tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  /**
   * Đăng xuất và xóa session
   * @description Clear sessionString khỏi localStorage để không tự động đăng nhập lại
   */
  const handleLogout = async () => {
    try {
      await authApi.logout();
      clearSessionString(); // Xóa session khỏi localStorage
      setAuthStatus('awaiting_phone');
      clearQueue();
      console.log('👋 Đã đăng xuất và xóa session');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  // Hiển thị loading khi đang khôi phục session
  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Đang khôi phục phiên đăng nhập...</h2>
          <p className="text-gray-400">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-surface-light bg-surface/50 backdrop-blur-sm flex-shrink-0 z-50">
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
            <TTSStatusBadge />
            <TTSSettings />
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

      {/* Main Content - Giảm padding trái phải */}
      <main className="flex-1 overflow-auto max-w-7xl mx-auto px-2 py-4 w-full">
        {authStatus !== 'connected' ? (
          // Login Screen
          <div className="max-w-md mx-auto py-12">
            <LoginForm />
          </div>
        ) : (
          // Main App
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left Column: Group Selector - Tăng chiều rộng lên 2/5 (40%) */}
            <div className="lg:col-span-2 h-[calc(100vh-180px)]">
              <GroupSelector />
            </div>

            {/* Right Column: Player & Queue - Còn 3/5 (60%) */}
            <div className="lg:col-span-3 space-y-4">
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
      <footer className="border-t border-surface-light py-4 flex-shrink-0">
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
