/**
 * API Client - Wrapper cho fetch API
 *
 * @description Cung cấp apiClient function với base URL và error handling
 * @uses Gọi đến backend production: https://ttstelegram.onrender.com/api
 */

import { authStore } from '../../stores/authStore';

// API Base URL - Production server
const API_BASE = 'https://ttstelegram.onrender.com/api';

/**
 * Custom Error class cho API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`Lỗi API: ${status} - ${body}`);
    this.name = 'ApiError';
  }
}

/**
 * API Response wrapper type
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * API Client - Wrapper function cho fetch với auth header
 *
 * @description Tự động thêm Authorization header nếu có session
 * @param endpoint - API endpoint (e.g. "/dialogs")
 * @param options - Fetch options
 * @returns Promise với data hoặc throw ApiError
 *
 * @example
 * const dialogs = await apiClient<DialogsResponse>('/dialogs');
 * const result = await apiClient('/auth/send-code', { method: 'POST', body: JSON.stringify({ phoneNumber }) });
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await authStore.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Thêm Authorization header nếu có session
  if (session) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session}`;
  }

  console.log(`[API] ${options.method || 'GET'} ${API_BASE}${endpoint}`);
  console.log('[API] Có session:', session ? 'Có' : 'Không');

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Parse response body
    const text = await response.text();
    console.log('[API] Response status:', response.status);
    console.log('[API] Response text (first 200 chars):', text.substring(0, 200));

    let data: ApiResponse<T>;

    try {
      data = JSON.parse(text);
    } catch {
      console.error('[API] Lỗi parse JSON:', text.substring(0, 100));
      throw new ApiError(response.status, text);
    }

    // Check for HTTP errors
    if (!response.ok) {
      console.error('[API] HTTP Error:', response.status, data.error);
      throw new ApiError(response.status, data.error || text);
    }

    // Return data if success
    if (data.success && data.data !== undefined) {
      console.log('[API] Thành công, data type:', typeof data.data);
      return data.data;
    }

    console.error('[API] Không thành công:', data.error);
    throw new ApiError(response.status, data.error || 'Lỗi không xác định');
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error
    console.error('[API] Network error:', error);
    throw new ApiError(0, error instanceof Error ? error.message : 'Lỗi kết nối mạng');
  }
}

/**
 * Helper để get API base URL (dùng cho debug)
 */
export function getApiBaseUrl(): string {
  return API_BASE;
}
