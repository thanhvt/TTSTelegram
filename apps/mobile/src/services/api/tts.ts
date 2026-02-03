/**
 * TTS API Service - Text-to-Speech synthesis
 *
 * @description Gọi endpoints /tts/*
 */

import { apiClient, getApiBaseUrl } from './client';

// ============================================
// TYPES
// ============================================

export type TTSProvider = 'google' | 'openai' | 'google-cloud';

interface TTSVoice {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  provider: TTSProvider;
}

interface VoicesResponse {
  voices: TTSVoice[];
  openaiAvailable: boolean;
  googleCloudAvailable: boolean;
}

interface SynthesizeRequest {
  text: string;
  provider: TTSProvider;
  voice: string;
  randomVoice?: boolean;
}

interface SynthesizeResponse {
  id: string;
  duration: number;
  voiceUsed: string;
  providerUsed: TTSProvider;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Lấy danh sách voices
 *
 * @returns Danh sách voices + availability info
 */
export async function getVoices(): Promise<VoicesResponse> {
  return apiClient<VoicesResponse>('/tts/voices');
}

/**
 * Synthesize text thành audio
 *
 * @param text - Nội dung text cần đọc
 * @param provider - TTS provider (google, openai, google-cloud)
 * @param voice - Voice ID
 * @param randomVoice - Chọn voice ngẫu nhiên?
 * @returns Audio ID và metadata
 */
export async function synthesize(
  text: string,
  provider: TTSProvider,
  voice: string,
  randomVoice: boolean = false
): Promise<SynthesizeResponse> {
  return apiClient<SynthesizeResponse>('/tts/synthesize', {
    method: 'POST',
    body: JSON.stringify({
      text,
      provider,
      voice,
      randomVoice,
    } as SynthesizeRequest),
  });
}

/**
 * Lấy URL stream audio
 *
 * @param audioId - ID từ synthesize response
 * @returns Full URL để stream audio
 */
export function getStreamUrl(audioId: string): string {
  return `${getApiBaseUrl()}/tts/stream/${audioId}`;
}
