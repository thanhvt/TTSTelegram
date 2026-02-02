/**
 * Swagger Configuration - API Documentation
 *
 * @description Cấu hình Swagger UI cho API docs
 * @access http://localhost:3001/api-docs
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TTS Telegram Reader API',
      version: '1.0.0',
      description: `
API cho ứng dụng TTS Telegram Reader - Đọc tin nhắn Telegram bằng giọng nói.

## Tính năng chính:
- 📱 Xác thực Telegram (phone + OTP + 2FA)
- 📋 Lấy danh sách groups/channels
- 💬 Lấy tin nhắn từ groups
- 🔊 Chuyển đổi text sang audio (Edge TTS)

## Authentication Flow:
1. POST /api/auth/send-code (gửi OTP)
2. POST /api/auth/sign-in (xác nhận OTP)
3. GET /api/auth/status (kiểm tra trạng thái)
      `,
      contact: {
        name: 'Thành',
        email: 'thanh@example.com',
      },
    },
    servers: [
      {
        url: 'https://ttstelegram.onrender.com',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Xác thực Telegram',
      },
      {
        name: 'Dialogs',
        description: 'Groups và Channels',
      },
      {
        name: 'Messages',
        description: 'Tin nhắn',
      },
      {
        name: 'TTS',
        description: 'Text-to-Speech',
      },
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Trạng thái thành công',
            },
            data: {
              type: 'object',
              description: 'Dữ liệu trả về',
            },
            error: {
              type: 'string',
              description: 'Thông báo lỗi (nếu có)',
            },
          },
        },
        AuthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['disconnected', 'awaiting_phone', 'awaiting_code', 'awaiting_2fa', 'connected'],
              description: 'Trạng thái xác thực',
            },
          },
        },
        Dialog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Dialog ID',
            },
            title: {
              type: 'string',
              description: 'Tên group/channel',
            },
            type: {
              type: 'string',
              enum: ['group', 'channel', 'user', 'megagroup'],
              description: 'Loại dialog',
            },
            unreadCount: {
              type: 'integer',
              description: 'Số tin nhắn chưa đọc',
            },
            lastMessage: {
              type: 'string',
              description: 'Tin nhắn cuối cùng',
            },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Message ID',
            },
            dialogId: {
              type: 'string',
              description: 'Dialog ID',
            },
            text: {
              type: 'string',
              description: 'Nội dung tin nhắn',
            },
            senderName: {
              type: 'string',
              description: 'Tên người gửi',
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian gửi',
            },
          },
        },
        TTSVoice: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Tên đầy đủ của giọng đọc',
            },
            shortName: {
              type: 'string',
              description: 'Mã giọng đọc (vd: vi-VN-HoaiMyNeural)',
            },
            gender: {
              type: 'string',
              enum: ['Male', 'Female'],
              description: 'Giới tính',
            },
            locale: {
              type: 'string',
              description: 'Ngôn ngữ (vd: vi-VN)',
            },
          },
        },
        TTSResult: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Audio ID',
            },
            audioUrl: {
              type: 'string',
              description: 'URL để stream audio',
            },
            duration: {
              type: 'integer',
              description: 'Thời lượng ước tính (giây)',
            },
            text: {
              type: 'string',
              description: 'Text đã chuyển đổi',
            },
          },
        },
      },
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Health Check',
          description: 'Kiểm tra trạng thái server',
          responses: {
            '200': {
              description: 'Server hoạt động bình thường',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ApiResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/status': {
        get: {
          tags: ['Auth'],
          summary: 'Kiểm tra trạng thái xác thực',
          responses: {
            '200': {
              description: 'Trạng thái xác thực hiện tại',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        properties: {
                          data: { $ref: '#/components/schemas/AuthStatus' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/send-code': {
        post: {
          tags: ['Auth'],
          summary: 'Gửi mã OTP',
          description: 'Gửi mã xác thực đến số điện thoại Telegram',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['phoneNumber'],
                  properties: {
                    phoneNumber: {
                      type: 'string',
                      example: '+84912345678',
                      description: 'Số điện thoại (bao gồm mã quốc gia)',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Đã gửi mã thành công',
            },
            '400': {
              description: 'Số điện thoại không hợp lệ',
            },
          },
        },
      },
      '/api/auth/sign-in': {
        post: {
          tags: ['Auth'],
          summary: 'Đăng nhập',
          description: 'Xác nhận mã OTP và đăng nhập',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['phoneNumber', 'code'],
                  properties: {
                    phoneNumber: {
                      type: 'string',
                      example: '+84912345678',
                    },
                    code: {
                      type: 'string',
                      example: '12345',
                      description: 'Mã OTP 5-6 số',
                    },
                    password: {
                      type: 'string',
                      description: 'Mật khẩu 2FA (nếu có)',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Đăng nhập thành công',
            },
            '400': {
              description: 'Mã OTP sai hoặc cần 2FA',
            },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Đăng xuất',
          responses: {
            '200': {
              description: 'Đã đăng xuất',
            },
          },
        },
      },
      '/api/dialogs': {
        get: {
          tags: ['Dialogs'],
          summary: 'Lấy danh sách groups/channels',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 50 },
              description: 'Số lượng tối đa',
            },
            {
              name: 'type',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['group', 'channel', 'user'],
              },
              description: 'Lọc theo loại',
            },
          ],
          responses: {
            '200': {
              description: 'Danh sách dialogs',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Dialog' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'Chưa đăng nhập',
            },
          },
        },
      },
      '/api/messages/{dialogId}': {
        get: {
          tags: ['Messages'],
          summary: 'Lấy tin nhắn từ dialog',
          parameters: [
            {
              name: 'dialogId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Dialog ID',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 50, maximum: 300 },
              description: 'Số lượng tin nhắn',
            },
          ],
          responses: {
            '200': {
              description: 'Danh sách tin nhắn',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Message' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'Chưa đăng nhập',
            },
          },
        },
      },
      '/api/messages/batch': {
        post: {
          tags: ['Messages'],
          summary: 'Lấy tin nhắn từ nhiều dialogs',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['dialogIds'],
                  properties: {
                    dialogIds: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Danh sách Dialog IDs (tối đa 20)',
                    },
                    limit: {
                      type: 'integer',
                      default: 50,
                      description: 'Số tin nhắn mỗi dialog',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Tin nhắn theo từng dialog',
            },
          },
        },
      },
      '/api/tts/voices': {
        get: {
          tags: ['TTS'],
          summary: 'Lấy danh sách giọng đọc',
          parameters: [
            {
              name: 'locale',
              in: 'query',
              schema: { type: 'string', default: 'vi-VN' },
              description: 'Ngôn ngữ (vd: vi-VN, en-US)',
            },
          ],
          responses: {
            '200': {
              description: 'Danh sách voices',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/TTSVoice' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/tts/synthesize': {
        post: {
          tags: ['TTS'],
          summary: 'Tạo audio từ text',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['text'],
                  properties: {
                    text: {
                      type: 'string',
                      maxLength: 5000,
                      example: 'Xin chào, đây là ứng dụng đọc tin nhắn Telegram.',
                      description: 'Nội dung cần chuyển thành audio',
                    },
                    voice: {
                      type: 'string',
                      default: 'vi-VN-HoaiMyNeural',
                      description: 'Mã giọng đọc',
                    },
                    rate: {
                      type: 'integer',
                      minimum: -50,
                      maximum: 100,
                      default: 0,
                      description: 'Tốc độ đọc (%)',
                    },
                    volume: {
                      type: 'integer',
                      minimum: -50,
                      maximum: 50,
                      default: 0,
                      description: 'Âm lượng (%)',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Audio đã được tạo',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        properties: {
                          data: { $ref: '#/components/schemas/TTSResult' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '400': {
              description: 'Text không hợp lệ',
            },
          },
        },
      },
      '/api/tts/stream/{id}': {
        get: {
          tags: ['TTS'],
          summary: 'Stream audio',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Audio ID',
            },
          ],
          responses: {
            '200': {
              description: 'Audio stream',
              content: {
                'audio/mpeg': {},
              },
            },
            '404': {
              description: 'Audio không tồn tại',
            },
          },
        },
      },
      '/api/tts/{id}': {
        delete: {
          tags: ['TTS'],
          summary: 'Xóa audio',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Đã xóa',
            },
          },
        },
      },
    },
  },
  apis: [], // Không dùng JSDoc annotations
};

const specs = swaggerJsdoc(options);

/**
 * Setup Swagger UI cho Express app
 *
 * @param app - Express application
 */
export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui { max-width: 1200px; margin: 0 auto; }
    `,
    customSiteTitle: 'TTS Telegram API Docs',
  }));

  // API docs JSON endpoint
  app.get('/api-docs.json', (_req, res) => {
    res.json(specs);
  });

  console.log('📚 Swagger UI: http://localhost:3001/api-docs');
}
