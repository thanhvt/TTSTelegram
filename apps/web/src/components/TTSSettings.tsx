/**
 * TTSSettings - Component cài đặt Text-to-Speech
 *
 * @description Popup settings cho phép chọn TTS provider, voice, random mode và theme
 * @usage Hiển thị trong header qua gear icon
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, Mic, Sparkles, Volume2, Palette } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { ttsApi } from '../lib/api';
import { THEMES, getThemeList, applyTheme } from '../lib/themeConfig';

interface TTSVoice {
  id: string;
  name: string;
  shortName: string;
  gender: 'Male' | 'Female' | 'Neutral';
  description?: string;
  provider: 'google' | 'openai';
}

interface VoicesData {
  voices: TTSVoice[];
  openaiAvailable: boolean;
}

export function TTSSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [openaiAvailable, setOpenaiAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    ttsProvider,
    selectedVoice,
    randomVoice,
    theme,
    setTtsProvider,
    setSelectedVoice,
    setRandomVoice,
    setTheme,
  } = useAppStore();

  // Apply theme khi component mount hoặc theme thay đổi
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Fetch voices khi mở popup
  useEffect(() => {
    if (isOpen) {
      fetchVoices();
    }
  }, [isOpen]);

  const fetchVoices = async () => {
    setIsLoading(true);
    try {
      const data = await ttsApi.getVoices() as VoicesData;
      setVoices(data.voices);
      setOpenaiAvailable(data.openaiAvailable);
    } catch (error) {
      console.error('Lỗi lấy voices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Lọc voices theo provider hiện tại
  const filteredVoices = voices.filter(v => v.provider === ttsProvider);

  const handleProviderChange = (provider: 'google' | 'openai') => {
    if (provider === 'openai' && !openaiAvailable) {
      alert('OpenAI TTS chưa được cấu hình. Vui lòng thêm OPENAI_API_KEY vào file .env');
      return;
    }
    setTtsProvider(provider);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-ghost p-2 rounded-lg hover:bg-surface-light transition-colors"
        title="Cài đặt TTS"
      >
        <Settings className="w-5 h-5 text-gray-400 hover:text-white" />
      </button>

      {/* Modal Overlay - dùng Portal để render ở document.body, thoát khỏi header container */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Centering wrapper */}
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Modal Content - giới hạn 70vh để luôn fit màn hình */}
            <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header - fixed */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-surface-light">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Cài đặt TTS</h2>
                    <p className="text-xs text-gray-400">Tùy chỉnh giọng đọc</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-surface-light transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Body - scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Provider Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Nhà cung cấp TTS
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleProviderChange('google')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      ttsProvider === 'google'
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-surface-light bg-surface-light/50 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-2xl mb-2">🔊</div>
                    <div className="font-medium">Google TTS</div>
                    <div className="text-xs opacity-70 mt-1">Miễn phí</div>
                  </button>

                  <button
                    onClick={() => handleProviderChange('openai')}
                    className={`p-4 rounded-xl border-2 transition-all relative ${
                      ttsProvider === 'openai'
                        ? 'border-green-500 bg-green-500/10 text-white'
                        : openaiAvailable
                        ? 'border-surface-light bg-surface-light/50 text-gray-400 hover:border-gray-500'
                        : 'border-surface-light bg-surface-light/30 text-gray-600 cursor-not-allowed'
                    }`}
                    disabled={!openaiAvailable}
                  >
                    {!openaiAvailable && (
                      <div className="absolute top-2 right-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                        Cần API Key
                      </div>
                    )}
                    <div className="text-2xl mb-2">✨</div>
                    <div className="font-medium">OpenAI TTS</div>
                    <div className="text-xs opacity-70 mt-1">Chất lượng cao</div>
                  </button>
                </div>
              </div>

              {/* Voice Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">
                  Giọng đọc
                </label>
                {isLoading ? (
                  <div className="text-center py-4 text-gray-500">Đang tải...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredVoices.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        disabled={randomVoice}
                        className={`p-3 rounded-lg text-left transition-all ${
                          randomVoice
                            ? 'opacity-50 cursor-not-allowed bg-surface-light/30'
                            : selectedVoice === voice.id
                            ? 'bg-primary/20 border border-primary text-white'
                            : 'bg-surface-light/50 border border-transparent hover:border-gray-600 text-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{voice.name}</div>
                        {voice.description && (
                          <div className="text-xs text-gray-500 mt-1">{voice.description}</div>
                        )}
                        <div className="text-xs text-gray-600 mt-1">
                          {voice.gender === 'Male' ? '♂ Nam' : voice.gender === 'Female' ? '♀ Nữ' : '⚪ Trung tính'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Random Voice Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface-light/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Giọng ngẫu nhiên</div>
                    <div className="text-xs text-gray-400">Mỗi tin nhắn một giọng khác</div>
                  </div>
                </div>
                <button
                  onClick={() => setRandomVoice(!randomVoice)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    randomVoice ? 'bg-primary' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      randomVoice ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Theme Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Bảng màu
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {getThemeList().map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => setTheme(themeOption.id)}
                      className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                        theme === themeOption.id
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-surface-light/50 border-2 border-transparent hover:border-gray-600'
                      }`}
                    >
                      {/* Color Preview */}
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: THEMES[themeOption.id].colors.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: THEMES[themeOption.id].colors.accent }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: THEMES[themeOption.id].colors.background }}
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-1">
                        <div className="font-medium text-sm text-white">{themeOption.name}</div>
                        <div className="text-xs text-gray-500">{themeOption.description}</div>
                      </div>
                      {/* Selected indicator */}
                      {theme === themeOption.id && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Footer note inside scrollable area */}
              <div className="mt-4 pt-4 border-t border-surface-light/50">
                <div className="text-xs text-gray-500 text-center">
                  {ttsProvider === 'openai' 
                    ? '💡 OpenAI TTS có phí ~$0.015/1000 ký tự'
                    : '💡 Google TTS miễn phí và ổn định'}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
