/**
 * Messages Routes - Lấy tin nhắn từ groups/channels
 *
 * @description API endpoint để lấy tin nhắn từ một dialog cụ thể
 * @routes
 *   GET /api/messages/:dialogId - Lấy tin nhắn từ dialog
 */

import { Router, Request, Response } from 'express';
import { telegramService } from '../services/telegram.js';
import type { ApiResponse, TelegramMessage, PaginatedResponse } from '@tts-telegram/shared';

const router = Router();

/**
 * GET /api/messages/:dialogId
 * Lấy tin nhắn từ một group/channel cụ thể
 *
 * @param dialogId - ID của dialog
 * @query limit - Số lượng tin nhắn (default: 50, max: 300)
 */
router.get('/:dialogId', async (req: Request, res: Response<PaginatedResponse<TelegramMessage>>) => {
  try {
    // Kiểm tra đăng nhập
    if (telegramService.status !== 'connected') {
      res.status(401).json({
        success: false,
        error: 'Chưa đăng nhập Telegram',
        total: 0,
        page: 1,
        limit: 0,
        hasMore: false,
      });
      return;
    }

    const { dialogId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 300);

    const messages = await telegramService.getMessages(dialogId, limit);

    res.json({
      success: true,
      data: messages,
      total: messages.length,
      page: 1,
      limit,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('Lỗi lấy messages:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Không thể lấy tin nhắn',
      total: 0,
      page: 1,
      limit: 0,
      hasMore: false,
    });
  }
});

/**
 * POST /api/messages/batch
 * Lấy tin nhắn từ nhiều dialogs cùng lúc
 *
 * @body dialogIds - Mảng các dialog ID
 * @body limit - Số lượng tin nhắn mỗi dialog
 */
router.post('/batch', async (req: Request, res: Response<ApiResponse<Record<string, TelegramMessage[]>>>) => {
  try {
    if (telegramService.status !== 'connected') {
      res.status(401).json({
        success: false,
        error: 'Chưa đăng nhập Telegram',
      });
      return;
    }

    const { dialogIds, limit = 50 } = req.body as {
      dialogIds: string[];
      limit?: number;
    };

    if (!Array.isArray(dialogIds) || dialogIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Cần cung cấp danh sách dialogIds',
      });
      return;
    }

    // Giới hạn số lượng groups để tránh rate limit
    const limitedDialogIds = dialogIds.slice(0, 20);
    const result: Record<string, TelegramMessage[]> = {};

    // Lấy messages từ từng dialog
    for (const dialogId of limitedDialogIds) {
      try {
        result[dialogId] = await telegramService.getMessages(dialogId, Math.min(limit, 100));
        // Delay nhỏ để tránh rate limit
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Lỗi lấy messages từ ${dialogId}:`, error);
        result[dialogId] = [];
      }
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Lỗi batch messages:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy tin nhắn',
    });
  }
});

export default router;
