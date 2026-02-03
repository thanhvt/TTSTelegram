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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Thêm Authorization header nếu có session
  if (session) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Parse response body
    const text = await response.text();
    let data: ApiResponse<T>;

    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(response.status, text);
    }

    // Check for HTTP errors
    if (!response.ok) {
      throw new ApiError(response.status, data.error || text);
    }

    // Return data if success
    if (data.success && data.data !== undefined) {
      return data.data;
    }

    throw new ApiError(response.status, data.error || 'Lỗi không xác định');
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error
    throw new ApiError(0, error instanceof Error ? error.message : 'Lỗi kết nối mạng');
  }
}

/**
 * Helper để get API base URL (dùng cho debug)
 */
export function getApiBaseUrl(): string {
  return API_BASE;
}
