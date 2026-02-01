/**
 * TTS Routes - Text-to-Speech API
 *
 * @description API endpoints cho chuyển đổi text sang audio
 * @routes
 *   POST /api/tts/synthesize - Tạo audio từ text
 *   GET /api/tts/voices - Lấy danh sách voices
 *   GET /api/tts/stream/:id - Stream audio file
 *   DELETE /api/tts/:id - Xóa audio
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ttsService, type TTSVoice, type TTSSynthesizeResponse, type TTSProvider } from '../services/tts.js';

// Type local để không phụ thuộc @tts-telegram/shared
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const router: Router = Router();

// Validation schema
const synthesizeSchema = z.object({
  text: z.string().min(1).max(5000),
  provider: z.enum(['google', 'openai']).optional(),
  voice: z.string().optional(),
  randomVoice: z.boolean().optional(),
  rate: z.number().min(-50).max(100).optional(),
  volume: z.number().min(-50).max(50).optional(),
  pitch: z.number().min(-50).max(50).optional(),
});

/**
 * GET /api/tts/voices
 * Lấy danh sách giọng đọc khả dụng
 *
 * @query provider - Filter theo provider (google/openai)
 */
router.get('/voices', async (req: Request, res: Response<ApiResponse<{ voices: TTSVoice[]; openaiAvailable: boolean }>>) => {
  try {
    const provider = req.query.provider as TTSProvider | undefined;

    let voices: TTSVoice[];
    if (provider) {
      voices = ttsService.getVoicesByProvider(provider);
    } else {
      voices = ttsService.getAllVoices();
    }

    res.json({
      success: true,
      data: {
        voices,
        openaiAvailable: ttsService.isOpenAIAvailable(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy danh sách voices',
    });
  }
});

/**
 * POST /api/tts/synthesize
 * Chuyển đổi text thành audio
 */
router.post('/synthesize', async (req: Request, res: Response<ApiResponse<TTSSynthesizeResponse>>) => {
  try {
    const request = synthesizeSchema.parse(req.body);

    const result = await ttsService.synthesize(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Lỗi synthesize:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ: ' + error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tạo audio',
    });
  }
});

/**
 * POST /api/tts/synthesize-batch
 * Tạo audio cho nhiều tin nhắn cùng lúc
 */
router.post('/synthesize-batch', async (req: Request, res: Response<ApiResponse<TTSSynthesizeResponse[]>>) => {
  try {
    const { messages, voice } = req.body as {
      messages: Array<{ id: string; text: string }>;
      voice?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Cần cung cấp danh sách messages',
      });
      return;
    }

    // Giới hạn 10 messages mỗi lần
    const limitedMessages = messages.slice(0, 10);
    const results: TTSSynthesizeResponse[] = [];

    for (const msg of limitedMessages) {
      try {
        const result = await ttsService.synthesize({
          text: msg.text,
          voice,
        });
        results.push(result);
      } catch (error) {
        console.error(`Lỗi synthesize message ${msg.id}:`, error);
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi batch synthesize',
    });
  }
});

/**
 * GET /api/tts/stream/:id
 * Stream audio file
 */
router.get('/stream/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filepath = await ttsService.getAudioPath(id);

    if (!filepath) {
      res.status(404).json({
        success: false,
        error: 'Audio không tồn tại',
      });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${id}.mp3"`);
    res.sendFile(filepath);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi stream audio',
    });
  }
});

/**
 * DELETE /api/tts/:id
 * Xóa audio file
 */
router.delete('/:id', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    await ttsService.deleteAudio(id);

    res.json({
      success: true,
      data: { message: 'Đã xóa audio' },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi xóa audio',
    });
  }
});

/**
 * DELETE /api/tts/cache/clear
 * Xóa toàn bộ cache
 */
router.delete('/cache/clear', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    await ttsService.clearCache();

    res.json({
      success: true,
      data: { message: 'Đã xóa toàn bộ cache' },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi xóa cache',
    });
  }
});

export default router;
