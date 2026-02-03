/**
 * Auth API Service - Xử lý authentication với Telegram
 *
 * @description Gọi các endpoints /auth/*
 * @endpoints POST /auth/send-code, POST /auth/sign-in, POST /auth/restore, POST /auth/logout
 */

import { apiClient } from './client';

// ============================================
// TYPES
// ============================================

interface SendCodeRequest {
  phoneNumber: string;
}

interface SendCodeResponse {
  message: string;
  phoneCodeHash: string;
}

interface SignInRequest {
  phoneNumber: string;
  code: string;
  password?: string; // Cho 2FA
}

interface SignInResponse {
  sessionString: string;
}

interface RestoreRequest {
  sessionString: string;
}

interface RestoreResponse {
  restored: boolean;
}

interface LogoutResponse {
  message: string;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Gửi mã OTP đến số điện thoại
 *
 * @param phoneNumber - Số điện thoại format quốc tế (e.g. "+84376340112")
 * @returns phoneCodeHash để dùng cho signIn
 */
export async function sendCode(phoneNumber: string): Promise<SendCodeResponse> {
  return apiClient<SendCodeResponse>('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber } as SendCodeRequest),
  });
}

/**
 * Đăng nhập với mã OTP
 *
 * @param phoneNumber - Số điện thoại
 * @param code - Mã OTP từ Telegram
 * @param password - Mật khẩu 2FA (optional)
 * @returns sessionString để lưu vào SecureStore
 */
export async function signIn(
  phoneNumber: string,
  code: string,
  password?: string
): Promise<SignInResponse> {
  return apiClient<SignInResponse>('/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, code, password } as SignInRequest),
  });
}

/**
 * Khôi phục session đã lưu
 *
 * @param sessionString - Session token từ SecureStore
 * @returns true nếu session còn hợp lệ
 */
export async function restoreSession(sessionString: string): Promise<boolean> {
  const response = await apiClient<RestoreResponse>('/auth/restore', {
    method: 'POST',
    body: JSON.stringify({ sessionString } as RestoreRequest),
  });
  return response.restored;
}

/**
 * Đăng xuất và xóa session
 */
export async function logout(): Promise<void> {
  await apiClient<LogoutResponse>('/auth/logout', {
    method: 'POST',
  });
}
