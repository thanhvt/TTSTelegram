/**
 * TTS Telegram API - Entry Point
 *
 * @description Express server cho TTS Telegram Reader
 * @usage pnpm dev:api
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import dialogsRoutes from './routes/dialogs.js';
import messagesRoutes from './routes/messages.js';
import ttsRoutes from './routes/tts.js';

// Import services
import { telegramService } from './services/telegram.js';

// Import swagger
import { setupSwagger } from './swagger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

// Setup Swagger UI
setupSwagger(app);

// ============================================
// MIDDLEWARE
// ============================================

// CORS - cho phép frontend truy cập
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Parse JSON body
app.use(express.json());

// Logging middleware
app.use((req, _res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      telegram: telegramService.status,
      timestamp: new Date().toISOString(),
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dialogs', dialogsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/tts', ttsRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint không tồn tại',
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Lỗi server',
  });
});

// ============================================
// STARTUP
// ============================================

async function startServer() {
  try {
    // Kết nối Telegram nếu có session
    if (process.env.SESSION_STRING) {
      console.log('🔄 Đang khôi phục session Telegram...');
      await telegramService.connect();
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║     🎧 TTS Telegram Reader API             ║
║────────────────────────────────────────────║
║  📍 Server: http://localhost:${PORT}          ║
║  📊 Health: http://localhost:${PORT}/api/health║
║  📱 Telegram: ${telegramService.status.padEnd(20)}  ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Không thể khởi động server:', error);
    process.exit(1);
  }
}

startServer();
