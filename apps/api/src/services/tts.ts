/**
 * TTS Service - Text-to-Speech sử dụng Edge TTS
 *
 * @description Chuyển đổi text thành audio sử dụng Microsoft Edge TTS
 * @usage Được sử dụng bởi route /api/tts
 */

import { EdgeTTS } from '@lixen/edge-tts';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { TTSVoice, TTSSynthesizeRequest, TTSSynthesizeResponse } from '@tts-telegram/shared';

// Thư mục cache audio
const AUDIO_CACHE_DIR = path.join(process.cwd(), 'audio-cache');

// Danh sách giọng đọc tiếng Việt
const VIETNAMESE_VOICES: TTSVoice[] = [
  {
    name: 'Microsoft HoaiMy Online (Natural) - Vietnamese (Vietnam)',
    shortName: 'vi-VN-HoaiMyNeural',
    gender: 'Female',
    locale: 'vi-VN',
  },
  {
    name: 'Microsoft NamMinh Online (Natural) - Vietnamese (Vietnam)',
    shortName: 'vi-VN-NamMinhNeural',
    gender: 'Male',
    locale: 'vi-VN',
  },
];

/**
 * Service quản lý Text-to-Speech
 */
class TTSService {
  private defaultVoice = 'vi-VN-HoaiMyNeural';

  constructor() {
    this.ensureCacheDir();
  }

  /**
   * Đảm bảo thư mục cache tồn tại
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(AUDIO_CACHE_DIR, { recursive: true });
      console.log('📁 TTS: Thư mục cache:', AUDIO_CACHE_DIR);
    } catch (error) {
      console.error('❌ TTS: Không thể tạo thư mục cache:', error);
    }
  }

  /**
   * Lấy danh sách giọng đọc tiếng Việt
   *
   * @returns TTSVoice[] - Danh sách voices
   */
  getVietnameseVoices(): TTSVoice[] {
    return VIETNAMESE_VOICES;
  }

  /**
   * Lấy tất cả voices từ Edge TTS
   *
   * @returns Promise<TTSVoice[]>
   */
  async getAllVoices(): Promise<TTSVoice[]> {
    try {
      const tts = new EdgeTTS();
      const voices = await tts.getVoices();

      return voices.map((v: { Name: string; ShortName: string; Gender: string; Locale: string }) => ({
        name: v.Name,
        shortName: v.ShortName,
        gender: v.Gender as 'Male' | 'Female',
        locale: v.Locale,
      }));
    } catch (error) {
      console.error('❌ TTS: Lỗi lấy danh sách voices:', error);
      return VIETNAMESE_VOICES;
    }
  }

  /**
   * Tạo audio từ text
   *
   * @param request - Yêu cầu synthesize
   * @returns Promise<TTSSynthesizeResponse> - Kết quả với audio URL
   */
  async synthesize(request: TTSSynthesizeRequest): Promise<TTSSynthesizeResponse> {
    const {
      text,
      voice = this.defaultVoice,
      rate = 0,
      volume = 0,
      pitch = 0,
    } = request;

    if (!text || text.trim().length === 0) {
      throw new Error('Text không được để trống');
    }

    const id = uuidv4();
    const filename = `${id}.mp3`;
    const filepath = path.join(AUDIO_CACHE_DIR, filename);

    try {
      const tts = new EdgeTTS();

      // Cấu hình voice và options
      await tts.synthesize(text, voice, {
        rate: `${rate >= 0 ? '+' : ''}${rate}%`,
        volume: `${volume >= 0 ? '+' : ''}${volume}%`,
        pitch: `${pitch >= 0 ? '+' : ''}${pitch}Hz`,
      });

      // Lưu audio ra file
      await tts.toFile(filepath);

      // Ước tính duration (khoảng 150 từ/phút cho tiếng Việt)
      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = Math.ceil((wordCount / 150) * 60);

      console.log(`🔊 TTS: Đã tạo audio ${filename} (${wordCount} từ, ~${estimatedDuration}s)`);

      return {
        id,
        audioUrl: `/api/tts/stream/${id}`,
        duration: estimatedDuration,
        text,
      };
    } catch (error) {
      console.error('❌ TTS: Lỗi synthesize:', error);
      throw new Error('Không thể tạo audio. Vui lòng thử lại.');
    }
  }

  /**
   * Lấy đường dẫn file audio
   *
   * @param id - ID của audio
   * @returns string | null - Đường dẫn file hoặc null nếu không tồn tại
   */
  async getAudioPath(id: string): Promise<string | null> {
    const filepath = path.join(AUDIO_CACHE_DIR, `${id}.mp3`);

    try {
      await fs.access(filepath);
      return filepath;
    } catch {
      return null;
    }
  }

  /**
   * Xóa audio đã tạo
   *
   * @param id - ID của audio
   */
  async deleteAudio(id: string): Promise<void> {
    const filepath = path.join(AUDIO_CACHE_DIR, `${id}.mp3`);

    try {
      await fs.unlink(filepath);
      console.log(`🗑️ TTS: Đã xóa ${id}.mp3`);
    } catch {
      // File không tồn tại - bỏ qua
    }
  }

  /**
   * Xóa tất cả audio cache
   */
  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(AUDIO_CACHE_DIR);

      for (const file of files) {
        if (file.endsWith('.mp3')) {
          await fs.unlink(path.join(AUDIO_CACHE_DIR, file));
        }
      }

      console.log(`🧹 TTS: Đã xóa ${files.length} files cache`);
    } catch (error) {
      console.error('❌ TTS: Lỗi xóa cache:', error);
    }
  }
}

// Export singleton instance
export const ttsService = new TTSService();
