/**
 * Script tạo Session String cho Production
 * 
 * Mục đích: Tạo session Telegram riêng cho môi trường production (Render)
 * Tham số đầu vào: TELEGRAM_APP_ID, TELEGRAM_API_HASH từ .env
 * Tham số đầu ra: SESSION_STRING để paste vào Render Environment Variables
 * Khi nào dùng: Khi gặp lỗi AUTH_KEY_DUPLICATED do dùng chung session với local
 * 
 * Usage: 
 * 1. cd scripts
 * 2. tsx get-session.ts
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import 'dotenv/config';

const APP_ID = parseInt(process.env.TELEGRAM_APP_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';

async function main() {
  console.log('');
  console.log('🔐 Tạo Session String cho Production');
  console.log('=====================================');
  console.log('');
  
  if (!APP_ID || !API_HASH) {
    console.error('❌ Thiếu TELEGRAM_APP_ID hoặc TELEGRAM_API_HASH trong .env');
    process.exit(1);
  }

  const session = new StringSession(''); // Empty session = tạo mới
  const client = new TelegramClient(session, APP_ID, API_HASH, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('📱 Nhập số điện thoại (+84...): '),
    phoneCode: async () => await input.text('📨 Nhập mã OTP: '),
    password: async () => await input.text('🔒 Mật khẩu 2FA (nếu có, enter để bỏ qua): '),
    onError: (err) => console.error('❌ Lỗi:', err),
  });

  console.log('');
  console.log('✅ Đăng nhập thành công!');
  console.log('');
  console.log('📋 SESSION_STRING cho Render:');
  console.log('=====================================');
  console.log(session.save());
  console.log('=====================================');
  console.log('');
  console.log('💡 Copy chuỗi trên và paste vào Render Environment Variables (SESSION_STRING)');
  console.log('');

  await client.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
