/**
 * useVoices Hook - Lấy danh sách voices từ API
 *
 * @description Hook để lấy available voices cho TTS
 */

import { useEffect, useState, useCallback } from 'react';
import * as ttsApi from '../services/api/tts';

export type TTSProvider = 'google' | 'openai' | 'google-cloud';

export interface Voice {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  provider: TTSProvider;
}

interface VoicesState {
  voices: Voice[];
  openaiAvailable: boolean;
  googleCloudAvailable: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * useVoices Hook
 *
 * @returns Object với voices data và loading state
 */
export function useVoices() {
  const [state, setState] = useState<VoicesState>({
    voices: [],
    openaiAvailable: false,
    googleCloudAvailable: false,
    isLoading: true,
    error: null,
  });

  const fetchVoices = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await ttsApi.getVoices();
      setState({
        voices: data.voices,
        openaiAvailable: data.openaiAvailable,
        googleCloudAvailable: data.googleCloudAvailable,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      }));
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  /**
   * Lọc voices theo provider
   */
  const getVoicesByProvider = useCallback(
    (provider: TTSProvider): Voice[] => {
      return state.voices.filter((v) => v.provider === provider);
    },
    [state.voices]
  );

  return {
    ...state,
    refetch: fetchVoices,
    getVoicesByProvider,
  };
}
