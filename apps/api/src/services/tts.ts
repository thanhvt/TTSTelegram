/**
 * TTS Service - Text-to-Speech sử dụng Google TTS
 *
 * @description Chuyển đổi text thành audio sử dụng Google TTS (miễn phí)
 * @usage Được sử dụng bởi route /api/tts
 *
 * Note: Edge TTS bị Microsoft chặn từ 2025 qua anti-abuse tokens (Sec-MS-GEC).
 * Chi tiết: Microsoft yêu cầu token ngắn hạn chỉ có thể lấy từ trình duyệt Edge chính hãng,
 * các ứng dụng bên ngoài sẽ nhận lỗi 403 Forbidden.
 */

// @ts-ignore - node-gtts không có type declarations
import gTTS from 'node-gtts';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Types định nghĩa inline
export interface TTSVoice {
  id: string;
  name: string;
  shortName: string;
  gender: 'Male' | 'Female' | 'Neutral';
  locale: string;
  description?: string;
}

export interface TTSSynthesizeRequest {
  text: string;
  voice?: string;
  randomVoice?: boolean; // Chế độ ngẫu nhiên giọng đọc
  rate?: number;
  volume?: number;
  pitch?: number;
}

export interface TTSSynthesizeResponse {
  id: string;
  audioUrl: string;
  duration: number;
  text: string;
  voiceUsed?: string; // Giọng đọc đã sử dụng
}

// Thư mục cache audio
const AUDIO_CACHE_DIR = path.join(process.cwd(), 'audio-cache');

/**
 * Danh sách giọng đọc hỗ trợ
 * Google TTS hỗ trợ nhiều ngôn ngữ với các accent khác nhau
 * Để tạo đa dạng, ta sử dụng các accent tiếng Anh khác nhau kết hợp với tiếng Việt
 */
const AVAILABLE_VOICES: TTSVoice[] = [
  // Tiếng Việt
  {
    id: 'vi',
    name: 'Tiếng Việt',
    shortName: 'vi',
    gender: 'Female',
    locale: 'vi-VN',
    description: 'Giọng nữ tiếng Việt chuẩn',
  },
  // Tiếng Anh - các accent khác nhau (có thể dùng cho đa dạng)
  {
    id: 'en-us',
    name: 'English (US)',
    shortName: 'en-us',
    gender: 'Female',
    locale: 'en-US',
    description: 'Giọng Mỹ - dùng cho reading practice',
  },
  {
    id: 'en-uk',
    name: 'English (UK)',
    shortName: 'en-uk',
    gender: 'Female',
    locale: 'en-GB',
    description: 'Giọng Anh - formal hơn',
  },
  {
    id: 'en-au',
    name: 'English (Australia)',
    shortName: 'en-au',
    gender: 'Female',
    locale: 'en-AU',
    description: 'Giọng Úc - độc đáo',
  },
];

// Chỉ lấy voices tiếng Việt để hiển thị mặc định
const VIETNAMESE_VOICES = AVAILABLE_VOICES.filter((v) => v.locale.startsWith('vi'));

/**
 * Service quản lý Text-to-Speech với Google TTS
 * Hỗ trợ chọn giọng đọc và chế độ ngẫu nhiên
 */
class TTSService {
  private defaultVoice = 'vi';
  private allVoices = AVAILABLE_VOICES;

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
   * Lấy danh sách giọng đọc tiếng Việt (mặc định)
   *
   * @returns TTSVoice[] - Danh sách voices tiếng Việt
   */
  getVietnameseVoices(): TTSVoice[] {
    return VIETNAMESE_VOICES;
  }

  /**
   * Lấy tất cả voices có sẵn
   *
   * @returns Promise<TTSVoice[]>
   */
  async getAllVoices(): Promise<TTSVoice[]> {
    return this.allVoices;
  }

  /**
   * Chọn giọng ngẫu nhiên từ danh sách
   *
   * @param voiceIds - Danh sách voice IDs để chọn (mặc định: tất cả)
   * @returns TTSVoice - Giọng được chọn ngẫu nhiên
   */
  getRandomVoice(voiceIds?: string[]): TTSVoice {
    const voicePool = voiceIds
      ? this.allVoices.filter((v) => voiceIds.includes(v.id))
      : this.allVoices;

    const randomIndex = Math.floor(Math.random() * voicePool.length);
    return voicePool[randomIndex] || this.allVoices[0];
  }

  /**
   * Tạo audio từ text sử dụng Google TTS
   *
   * @param request - Yêu cầu synthesize
   * @returns Promise<TTSSynthesizeResponse> - Kết quả với audio URL
   */
  async synthesize(request: TTSSynthesizeRequest): Promise<TTSSynthesizeResponse> {
    let { voice = this.defaultVoice } = request;
    const { text, randomVoice = false } = request;

    if (!text || text.trim().length === 0) {
      throw new Error('Text không được để trống');
    }

    // Nếu random voice được bật, chọn giọng ngẫu nhiên
    if (randomVoice) {
      const randomVoiceObj = this.getRandomVoice();
      voice = randomVoiceObj.shortName;
      console.log(`🎲 TTS: Random voice: ${randomVoiceObj.name} (${voice})`);
    }

    // Giới hạn độ dài text để tránh timeout
    const maxLength = 5000;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    const id = uuidv4();
    const filename = `${id}.mp3`;
    const filepath = path.join(AUDIO_CACHE_DIR, filename);

    try {
      // Sử dụng Google TTS với voice được chọn
      const gtts = gTTS(voice);

      // Wrap callback API thành Promise
      await new Promise<void>((resolve, reject) => {
        gtts.save(filepath, truncatedText, (err?: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Ước tính duration (khoảng 150 từ/phút cho tiếng Việt)
      const wordCount = truncatedText.split(/\s+/).length;
      const estimatedDuration = Math.max(1, Math.ceil((wordCount / 150) * 60));

      console.log(`🔊 TTS: Đã tạo audio ${filename} (voice: ${voice}, ${wordCount} từ, ~${estimatedDuration}s)`);

      return {
        id,
        audioUrl: `/api/tts/stream/${id}`,
        duration: estimatedDuration,
        text: truncatedText,
        voiceUsed: voice,
      };
    } catch (error) {
      console.error('❌ TTS: Lỗi synthesize:', error);
      throw new Error(`Không thể tạo audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
