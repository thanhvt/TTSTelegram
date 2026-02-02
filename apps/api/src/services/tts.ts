/**
 * TTS Service - Text-to-Speech với đa nhà cung cấp
 *
 * @description Hỗ trợ Google TTS (miễn phí) và OpenAI TTS (có phí, chất lượng cao)
 * @usage Được sử dụng bởi route /api/tts
 *
 * Providers:
 * - Google TTS: Miễn phí, sử dụng node-gtts
 * - OpenAI TTS: $0.015/1000 chars, sử dụng openai SDK với models tts-1/tts-1-hd
 */

// @ts-ignore - node-gtts không có type declarations
import gTTS from 'node-gtts';
import OpenAI from 'openai';
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { normalizeText } from '@tts-telegram/shared/TextNormalizationService.js';

// ============================================
// TYPES
// ============================================

export type TTSProvider = 'google' | 'openai' | 'google-cloud';

export interface TTSVoice {
  id: string;
  name: string;
  shortName: string;
  gender: 'Male' | 'Female' | 'Neutral';
  locale: string;
  description?: string;
  provider: TTSProvider;
}

export interface TTSSynthesizeRequest {
  text: string;
  provider?: TTSProvider;
  voice?: string;
  randomVoice?: boolean;
  rate?: number;
  volume?: number;
  pitch?: number;
}

export interface TTSSynthesizeResponse {
  id: string;
  audioUrl: string;
  duration: number;
  text: string;
  voiceUsed?: string;
  providerUsed?: TTSProvider;
}

// ============================================
// CONSTANTS
// ============================================

const AUDIO_CACHE_DIR = path.join(process.cwd(), 'audio-cache');

/**
 * Danh sách giọng Google TTS
 */
const GOOGLE_VOICES: TTSVoice[] = [
  {
    id: 'vi',
    name: 'Tiếng Việt',
    shortName: 'vi',
    gender: 'Female',
    locale: 'vi-VN',
    description: 'Giọng nữ tiếng Việt chuẩn',
    provider: 'google',
  },
  {
    id: 'en-us',
    name: 'English (US)',
    shortName: 'en-us',
    gender: 'Female',
    locale: 'en-US',
    description: 'Giọng Mỹ',
    provider: 'google',
  },
  {
    id: 'en-uk',
    name: 'English (UK)',
    shortName: 'en-uk',
    gender: 'Female',
    locale: 'en-GB',
    description: 'Giọng Anh',
    provider: 'google',
  },
  {
    id: 'en-au',
    name: 'English (Australia)',
    shortName: 'en-au',
    gender: 'Female',
    locale: 'en-AU',
    description: 'Giọng Úc',
    provider: 'google',
  },
];

/**
 * Danh sách giọng OpenAI TTS
 * Hỗ trợ đa ngôn ngữ (bao gồm tiếng Việt)
 */
const OPENAI_VOICES: TTSVoice[] = [
  {
    id: 'alloy',
    name: 'Alloy',
    shortName: 'alloy',
    gender: 'Neutral',
    locale: 'multi',
    description: 'Cân bằng, trung tính',
    provider: 'openai',
  },
  {
    id: 'echo',
    name: 'Echo',
    shortName: 'echo',
    gender: 'Male',
    locale: 'multi',
    description: 'Ấm áp, trầm',
    provider: 'openai',
  },
  {
    id: 'fable',
    name: 'Fable',
    shortName: 'fable',
    gender: 'Neutral',
    locale: 'multi',
    description: 'Biểu cảm, British',
    provider: 'openai',
  },
  {
    id: 'onyx',
    name: 'Onyx',
    shortName: 'onyx',
    gender: 'Male',
    locale: 'multi',
    description: 'Sâu, quyền lực',
    provider: 'openai',
  },
  {
    id: 'nova',
    name: 'Nova',
    shortName: 'nova',
    gender: 'Female',
    locale: 'multi',
    description: 'Thân thiện, nữ tính',
    provider: 'openai',
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    shortName: 'shimmer',
    gender: 'Female',
    locale: 'multi',
    description: 'Rõ ràng, lạc quan',
    provider: 'openai',
  },
];

/**
 * Danh sách giọng Google Cloud TTS tiếng Việt
 * Bao gồm Neural2, WaveNet và Standard
 * Chi phí: Neural2 ~$16/1M chars, WaveNet ~$16/1M chars, Standard ~$4/1M chars
 */
const GOOGLE_CLOUD_VOICES: TTSVoice[] = [
  // Neural2 - Chất lượng cao nhất
  {
    id: 'vi-VN-Neural2-A',
    name: 'Neural2 Nữ A',
    shortName: 'vi-VN-Neural2-A',
    gender: 'Female',
    locale: 'vi-VN',
    description: '⭐ Chất lượng cao, tự nhiên',
    provider: 'google-cloud',
  },
  {
    id: 'vi-VN-Neural2-D',
    name: 'Neural2 Nam D',
    shortName: 'vi-VN-Neural2-D',
    gender: 'Male',
    locale: 'vi-VN',
    description: '⭐ Chất lượng cao, tự nhiên',
    provider: 'google-cloud',
  },
  // WaveNet - Chất lượng cao
  {
    id: 'vi-VN-Wavenet-A',
    name: 'WaveNet Nữ A',
    shortName: 'vi-VN-Wavenet-A',
    gender: 'Female',
    locale: 'vi-VN',
    description: 'Giọng nữ, mềm mại',
    provider: 'google-cloud',
  },
  {
    id: 'vi-VN-Wavenet-B',
    name: 'WaveNet Nam B',
    shortName: 'vi-VN-Wavenet-B',
    gender: 'Male',
    locale: 'vi-VN',
    description: 'Giọng nam, trầm ấm',
    provider: 'google-cloud',
  },
  {
    id: 'vi-VN-Wavenet-C',
    name: 'WaveNet Nữ C',
    shortName: 'vi-VN-Wavenet-C',
    gender: 'Female',
    locale: 'vi-VN',
    description: 'Giọng nữ, trong trẻo',
    provider: 'google-cloud',
  },
  {
    id: 'vi-VN-Wavenet-D',
    name: 'WaveNet Nam D',
    shortName: 'vi-VN-Wavenet-D',
    gender: 'Male',
    locale: 'vi-VN',
    description: 'Giọng nam, rõ ràng',
    provider: 'google-cloud',
  },
  // Standard - Miễn phí tier
  {
    id: 'vi-VN-Standard-A',
    name: 'Standard Nữ A',
    shortName: 'vi-VN-Standard-A',
    gender: 'Female',
    locale: 'vi-VN',
    description: 'Giọng cơ bản, tiết kiệm',
    provider: 'google-cloud',
  },
  {
    id: 'vi-VN-Standard-B',
    name: 'Standard Nam B',
    shortName: 'vi-VN-Standard-B',
    gender: 'Male',
    locale: 'vi-VN',
    description: 'Giọng cơ bản, tiết kiệm',
    provider: 'google-cloud',
  },
  {
    id: 'vi-VN-Standard-C',
    name: 'Standard Nữ C',
    shortName: 'vi-VN-Standard-C',
    gender: 'Female',
    locale: 'vi-VN',
    description: 'Giọng cơ bản, tiết kiệm',
    provider: 'google-cloud',
  },
  {
    id: 'vi-VN-Standard-D',
    name: 'Standard Nam D',
    shortName: 'vi-VN-Standard-D',
    gender: 'Male',
    locale: 'vi-VN',
    description: 'Giọng cơ bản, tiết kiệm',
    provider: 'google-cloud',
  },
];

// ============================================
// TTS SERVICE
// ============================================

class TTSService {
  private openaiClient: OpenAI | null = null;
  private googleCloudClient: TextToSpeechClient | null = null;
  private defaultProvider: TTSProvider = 'google';
  private defaultGoogleVoice = 'vi';
  private defaultOpenAIVoice = 'nova';
  private defaultGoogleCloudVoice = 'vi-VN-Neural2-A';

  constructor() {
    this.ensureCacheDir();
    this.initOpenAI();
    this.initGoogleCloud();
  }

  /**
   * Khởi tạo OpenAI client nếu có API key
   */
  private initOpenAI(): void {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openaiClient = new OpenAI({ apiKey });
      console.log('✅ TTS: OpenAI đã khởi tạo');
    } else {
      console.log('⚠️ TTS: Không có OPENAI_API_KEY - OpenAI TTS bị tắt');
    }
  }

  /**
   * Khởi tạo Google Cloud TTS client nếu có API key
   */
  private initGoogleCloud(): void {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (apiKey) {
      // Sử dụng API key để khởi tạo client
      this.googleCloudClient = new TextToSpeechClient({
        apiKey: apiKey,
      });
      console.log('✅ TTS: Google Cloud đã khởi tạo');
    } else {
      console.log('⚠️ TTS: Không có GOOGLE_CLOUD_API_KEY - Google Cloud TTS bị tắt');
    }
  }

  /**
   * Đảm bảo thư mục cache tồn tại
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(AUDIO_CACHE_DIR, { recursive: true });
      console.log('📁 TTS: Cache:', AUDIO_CACHE_DIR);
    } catch (error) {
      console.error('❌ TTS: Không thể tạo cache dir:', error);
    }
  }

  /**
   * Lấy danh sách voices theo provider
   */
  getVoicesByProvider(provider: TTSProvider): TTSVoice[] {
    switch (provider) {
      case 'openai':
        return OPENAI_VOICES;
      case 'google-cloud':
        return GOOGLE_CLOUD_VOICES;
      default:
        return GOOGLE_VOICES;
    }
  }

  /**
   * Lấy tất cả voices
   */
  getAllVoices(): TTSVoice[] {
    return [
      ...GOOGLE_VOICES,
      ...(this.openaiClient ? OPENAI_VOICES : []),
      ...(this.googleCloudClient ? GOOGLE_CLOUD_VOICES : []),
    ];
  }

  /**
   * Kiểm tra Google Cloud có khả dụng không
   */
  isGoogleCloudAvailable(): boolean {
    return this.googleCloudClient !== null;
  }

  /**
   * Lấy voices tiếng Việt (tương thích cũ)
   */
  getVietnameseVoices(): TTSVoice[] {
    return GOOGLE_VOICES.filter((v) => v.locale.startsWith('vi'));
  }

  /**
   * Kiểm tra OpenAI có khả dụng không
   */
  isOpenAIAvailable(): boolean {
    return this.openaiClient !== null;
  }

  /**
   * Chọn voice ngẫu nhiên
   */
  getRandomVoice(provider: TTSProvider): TTSVoice {
    const voices = this.getVoicesByProvider(provider);
    const index = Math.floor(Math.random() * voices.length);
    return voices[index];
  }

  /**
   * Synthesize với Google TTS
   */
  private async synthesizeWithGoogle(
    text: string,
    voice: string,
    id: string,
    filepath: string
  ): Promise<void> {
    const gtts = gTTS(voice);
    await new Promise<void>((resolve, reject) => {
      gtts.save(filepath, text, (err?: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Synthesize với OpenAI TTS
   */
  private async synthesizeWithOpenAI(
    text: string,
    voice: string,
    id: string,
    filepath: string
  ): Promise<void> {
    if (!this.openaiClient) {
      throw new Error('OpenAI TTS không khả dụng - thiếu API key');
    }

    const response = await this.openaiClient.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filepath, buffer);
  }

  /**
   * Synthesize với Google Cloud TTS
   * 
   * @description Sử dụng Google Cloud Text-to-Speech API với Neural2/WaveNet/Standard voices
   * @param text - Văn bản cần synthesize  
   * @param voice - Tên voice (ví dụ: vi-VN-Neural2-A)
   * @param id - ID duy nhất của audio
   * @param filepath - Đường dẫn lưu file audio
   */
  private async synthesizeWithGoogleCloud(
    text: string,
    voice: string,
    id: string,
    filepath: string
  ): Promise<void> {
    if (!this.googleCloudClient) {
      throw new Error('Google Cloud TTS không khả dụng - thiếu API key');
    }

    // Tạo request cho Google Cloud TTS
    const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: { text },
      voice: {
        languageCode: 'vi-VN',
        name: voice,
      },
      audioConfig: {
        audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
      },
    };

    // Gọi API
    const [response] = await this.googleCloudClient.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('Không nhận được audio từ Google Cloud TTS');
    }

    // Lưu file
    await fs.writeFile(filepath, response.audioContent as Buffer);
  }

  /**
   * Tạo audio từ text
   *
   * @param request - Yêu cầu synthesize với provider, voice, randomVoice
   * @returns Promise<TTSSynthesizeResponse>
   */
  async synthesize(request: TTSSynthesizeRequest): Promise<TTSSynthesizeResponse> {
    const { text, randomVoice = false } = request;
    let provider = request.provider || this.defaultProvider;
    let voice = request.voice;

    if (!text || text.trim().length === 0) {
      throw new Error('Text không được để trống');
    }

    // ✨ Chuẩn hóa text: teencode/slang -> formal Vietnamese
    // Ví dụ: "ko đc cm" -> "không được chúng mày"
    const normalizedText = normalizeText(text, {
      normalizeTeencode: true,
      filterProfanity: true, // Replace từ không phù hợp bằng placeholder
    });
    
    // Log nếu có thay đổi
    if (normalizedText !== text) {
      console.log(`📝 TTS: Normalized text`);
      console.log(`   Original: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
      console.log(`   Normalized: "${normalizedText.substring(0, 100)}${normalizedText.length > 100 ? '...' : ''}"`);
    }

    // Fallback nếu OpenAI không khả dụng
    if (provider === 'openai' && !this.openaiClient) {
      console.log('⚠️ TTS: Fallback từ OpenAI sang Google');
      provider = 'google';
    }

    // Fallback nếu Google Cloud không khả dụng
    if (provider === 'google-cloud' && !this.googleCloudClient) {
      console.log('⚠️ TTS: Fallback từ Google Cloud sang Google (miễn phí)');
      provider = 'google';
    }

    // Random voice nếu được bật
    if (randomVoice) {
      const randomVoiceObj = this.getRandomVoice(provider);
      voice = randomVoiceObj.shortName;
      console.log(`🎲 TTS: Random voice: ${randomVoiceObj.name} (${provider})`);
    }

    // Default voice theo provider
    if (!voice) {
      switch (provider) {
        case 'openai':
          voice = this.defaultOpenAIVoice;
          break;
        case 'google-cloud':
          voice = this.defaultGoogleCloudVoice;
          break;
        default:
          voice = this.defaultGoogleVoice;
      }
    }

    // Giới hạn text (sử dụng normalizedText thay vì text gốc)
    const maxLength = 5000;
    const truncatedText = normalizedText.length > maxLength ? normalizedText.substring(0, maxLength) + '...' : normalizedText;

    const id = uuidv4();
    const filename = `${id}.mp3`;
    const filepath = path.join(AUDIO_CACHE_DIR, filename);

    try {
      console.log(`🔊 TTS: Synthesizing với ${provider}, voice: ${voice}`);

      if (provider === 'openai') {
        await this.synthesizeWithOpenAI(truncatedText, voice, id, filepath);
      } else if (provider === 'google-cloud') {
        await this.synthesizeWithGoogleCloud(truncatedText, voice, id, filepath);
      } else {
        await this.synthesizeWithGoogle(truncatedText, voice, id, filepath);
      }

      // Ước tính duration
      const wordCount = truncatedText.split(/\s+/).length;
      const estimatedDuration = Math.max(1, Math.ceil((wordCount / 150) * 60));

      console.log(`✅ TTS: ${filename} (${provider}/${voice}, ${wordCount} từ)`);

      return {
        id,
        audioUrl: `/api/tts/stream/${id}`,
        duration: estimatedDuration,
        text: truncatedText,
        voiceUsed: voice,
        providerUsed: provider,
      };
    } catch (error) {
      console.error('❌ TTS: Lỗi synthesize:', error);
      throw new Error(`Không thể tạo audio: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Lấy đường dẫn file audio
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
   */
  async deleteAudio(id: string): Promise<void> {
    const filepath = path.join(AUDIO_CACHE_DIR, `${id}.mp3`);
    try {
      await fs.unlink(filepath);
      console.log(`🗑️ TTS: Đã xóa ${id}.mp3`);
    } catch {
      // Ignore
    }
  }

  /**
   * Xóa tất cả cache
   */
  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(AUDIO_CACHE_DIR);
      for (const file of files) {
        if (file.endsWith('.mp3')) {
          await fs.unlink(path.join(AUDIO_CACHE_DIR, file));
        }
      }
      console.log(`🧹 TTS: Đã xóa ${files.length} files`);
    } catch (error) {
      console.error('❌ TTS: Lỗi xóa cache:', error);
    }
  }
}

export const ttsService = new TTSService();
