/**
 * TTSStatusBadge - Hiển thị thông tin TTS trên header
 *
 * @description Badge hiển thị nhà cung cấp TTS và giọng đọc đang chọn
 * @usage Đặt trong header, bên cạnh nút Settings
 * @returns Badge với icon provider, tên voice, và trạng thái random
 */

import { Shuffle } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

// Mapping thông tin provider
const PROVIDER_INFO = {
  google: {
    icon: '🔊',
    name: 'Google',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  'google-cloud': {
    icon: '☁️',
    name: 'G-Cloud',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  openai: {
    icon: '✨',
    name: 'OpenAI',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
};

// Mapping tên giọng đọc thân thiện
const VOICE_DISPLAY_NAMES: Record<string, string> = {
  // Google Free
  vi: 'Tiếng Việt',
  // Google Cloud Neural2
  'vi-VN-Neural2-A': 'Nữ Neural2-A',
  'vi-VN-Neural2-D': 'Nam Neural2-D',
  // Google Cloud Standard
  'vi-VN-Standard-A': 'Nữ Standard-A',
  'vi-VN-Standard-B': 'Nam Standard-B',
  'vi-VN-Standard-C': 'Nữ Standard-C',
  'vi-VN-Standard-D': 'Nam Standard-D',
  // Google Cloud Wavenet
  'vi-VN-Wavenet-A': 'Nữ Wavenet-A',
  'vi-VN-Wavenet-B': 'Nam Wavenet-B',
  'vi-VN-Wavenet-C': 'Nữ Wavenet-C',
  'vi-VN-Wavenet-D': 'Nam Wavenet-D',
  // OpenAI
  alloy: 'Alloy',
  echo: 'Echo',
  fable: 'Fable',
  onyx: 'Onyx',
  nova: 'Nova',
  shimmer: 'Shimmer',
};

// Lấy gender icon từ voice ID
const getGenderIcon = (voiceId: string): string => {
  // Google Cloud voices: -A, -C thường là Nữ; -B, -D thường là Nam
  if (voiceId.endsWith('-A') || voiceId.endsWith('-C')) return '♀';
  if (voiceId.endsWith('-B') || voiceId.endsWith('-D')) return '♂';
  // OpenAI voices
  if (['nova', 'shimmer', 'alloy'].includes(voiceId)) return '♀';
  if (['echo', 'fable', 'onyx'].includes(voiceId)) return '♂';
  // Default
  return '🎤';
};

interface TTSStatusBadgeProps {
  onClick?: () => void;
}

export function TTSStatusBadge({ onClick }: TTSStatusBadgeProps) {
  const { ttsProvider, selectedVoice, randomVoice } = useAppStore();

  const providerInfo = PROVIDER_INFO[ttsProvider];
  const voiceName = VOICE_DISPLAY_NAMES[selectedVoice] || selectedVoice;
  const genderIcon = getGenderIcon(selectedVoice);

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        ${providerInfo.bgColor} ${providerInfo.borderColor}
        border transition-all hover:opacity-80
        cursor-pointer
      `}
      title="Nhấn để mở cài đặt TTS"
    >
      {/* Provider Icon */}
      <span className="text-sm">{providerInfo.icon}</span>

      {/* Provider Name */}
      <span className={`text-xs font-medium ${providerInfo.color}`}>
        {providerInfo.name}
      </span>

      {/* Divider */}
      <span className="text-gray-600">|</span>

      {/* Voice Info */}
      {randomVoice ? (
        <span className="flex items-center gap-1 text-xs text-purple-400">
          <Shuffle className="w-3 h-3" />
          Ngẫu nhiên
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-gray-300">
          <span>{genderIcon}</span>
          <span>{voiceName}</span>
        </span>
      )}
    </button>
  );
}
