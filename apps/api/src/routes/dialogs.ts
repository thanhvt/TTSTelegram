/**
 * Dialogs Routes - Lấy danh sách groups/channels
 *
 * @description API endpoint để lấy danh sách dialogs từ Telegram
 * @routes
 *   GET /api/dialogs - Lấy tất cả dialogs
 */

import { Router, Request, Response } from 'express';
import { telegramService } from '../services/telegram.js';
import type { ApiResponse, TelegramDialog } from '@tts-telegram/shared';

const router = Router();

/**
 * GET /api/dialogs
 * Lấy danh sách tất cả groups, channels, chats
 *
 * @query limit - Số lượng tối đa (default: 50)
 * @query type - Lọc theo loại: group, channel, user (optional)
 */
router.get('/', async (req: Request, res: Response<ApiResponse<TelegramDialog[]>>) => {
  try {
    // Kiểm tra đăng nhập
    if (telegramService.status !== 'connected') {
      res.status(401).json({
        success: false,
        error: 'Chưa đăng nhập Telegram. Vui lòng đăng nhập trước.',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const typeFilter = req.query.type as string | undefined;

    let dialogs = await telegramService.getDialogs(limit);

    // Lọc theo type nếu có
    if (typeFilter) {
      dialogs = dialogs.filter((d) => d.type === typeFilter);
    }

    // Sắp xếp theo unreadCount (nhiều nhất lên đầu)
    dialogs.sort((a, b) => b.unreadCount - a.unreadCount);

    res.json({
      success: true,
      data: dialogs,
    });
  } catch (error) {
    console.error('Lỗi lấy dialogs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Không thể lấy danh sách groups',
    });
  }
});

export default router;
