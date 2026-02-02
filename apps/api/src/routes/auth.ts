/**
 * Auth Routes - Xử lý xác thực Telegram
 *
 * @description API endpoints cho đăng nhập/đăng xuất Telegram
 * @routes
 *   POST /api/auth/send-code - Gửi mã OTP
 *   POST /api/auth/sign-in - Xác nhận mã + đăng nhập
 *   GET /api/auth/status - Kiểm tra trạng thái
 *   POST /api/auth/logout - Đăng xuất
 */

import { Router, Request, Response, type IRouter } from 'express';
import { z } from 'zod';
import { telegramService } from '../services/telegram.js';
import type { ApiResponse, AuthState } from '@tts-telegram/shared';

const router: IRouter = Router();

// Validation schemas
const sendCodeSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
});

const signInSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().min(5).max(6),
  password: z.string().optional(),
});

/**
 * GET /api/auth/status
 * Kiểm tra trạng thái xác thực hiện tại
 */
router.get('/status', async (_req: Request, res: Response<ApiResponse<AuthState>>) => {
  try {
    res.json({
      success: true,
      data: {
        status: telegramService.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định',
    });
  }
});

/**
 * POST /api/auth/send-code
 * Gửi mã xác thực đến số điện thoại
 */
router.post('/send-code', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { phoneNumber } = sendCodeSchema.parse(req.body);

    // Đảm bảo đã kết nối
    if (telegramService.status === 'disconnected') {
      await telegramService.connect();
    }

    await telegramService.sendCode(phoneNumber);

    res.json({
      success: true,
      data: { message: 'Đã gửi mã xác thực đến ' + phoneNumber },
    });
  } catch (error) {
    console.error('Lỗi gửi mã:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Không thể gửi mã xác thực',
    });
  }
});

/**
 * POST /api/auth/sign-in
 * Xác nhận mã OTP và đăng nhập
 */
router.post('/sign-in', async (req: Request, res: Response<ApiResponse<{ sessionString: string }>>) => {
  try {
    const { phoneNumber, code, password } = signInSchema.parse(req.body);

    const sessionString = await telegramService.signIn(phoneNumber, code, password);
    console.log('🔐 SESSION_STRING:', sessionString); 
    res.json({
      success: true,
      data: {
        sessionString,
      },
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);

    // Phân biệt lỗi 2FA
    if (error instanceof Error && error.message.includes('2FA')) {
      res.status(400).json({
        success: false,
        error: 'Tài khoản yêu cầu mật khẩu 2FA. Vui lòng nhập mật khẩu.',
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Đăng nhập thất bại',
    });
  }
});

/**
 * POST /api/auth/logout
 * Đăng xuất khỏi Telegram
 */
router.post('/logout', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    await telegramService.logout();

    res.json({
      success: true,
      data: { message: 'Đã đăng xuất' },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi đăng xuất',
    });
  }
});

/**
 * POST /api/auth/restore
 * Khôi phục session từ string đã lưu ở frontend
 * 
 * @body { sessionString: string } - Chuỗi session từ localStorage
 * @returns { success: boolean, data: { restored: boolean } }
 * @description Được gọi khi frontend load và có session trong localStorage
 */
router.post('/restore', async (req: Request, res: Response<ApiResponse<{ restored: boolean }>>) => {
  try {
    const { sessionString } = req.body as { sessionString?: string };

    if (!sessionString) {
      res.json({
        success: true,
        data: { restored: false },
      });
      return;
    }

    const restored = await telegramService.restoreSession(sessionString);

    res.json({
      success: true,
      data: { restored },
    });
  } catch (error) {
    console.error('Lỗi khôi phục session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Không thể khôi phục session',
    });
  }
});

export default router;
