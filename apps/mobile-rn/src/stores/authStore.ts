/**
 * Auth Store - Quản lý session trong Keychain (iOS) / Keystore (Android)
 *
 * @description Lưu trữ session token an toàn sử dụng react-native-keychain
 * @uses Separated từ appStore vì lý do bảo mật
 */

import * as Keychain from 'react-native-keychain';

const SERVICE_NAME = 'tts-telegram';

const KEYS = {
  SESSION: 'telegram_session',
  PHONE: 'telegram_phone',
} as const;

/**
 * Auth Store - Quản lý session credentials an toàn
 *
 * @methods
 * - getSession: Lấy session token từ Keychain/Keystore
 * - setSession: Lưu session token vào Keychain/Keystore
 * - clearSession: Xóa session (logout)
 * - getPhone: Lấy số điện thoại đã lưu
 * - setPhone: Lưu số điện thoại để auto-fill
 */
export const authStore = {
  /**
   * Lấy session token từ Secure Storage
   * @returns Session string hoặc null nếu chưa đăng nhập
   */
  async getSession(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: `${SERVICE_NAME}_session`,
      });
      if (credentials) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Lỗi khi lấy session:', error);
      return null;
    }
  },

  /**
   * Lưu session token vào Secure Storage
   * @param session - Session string từ Telegram API
   */
  async setSession(session: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(KEYS.SESSION, session, {
        service: `${SERVICE_NAME}_session`,
      });
    } catch (error) {
      console.error('Lỗi khi lưu session:', error);
      throw error;
    }
  },

  /**
   * Xóa session khi logout
   */
  async clearSession(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({
        service: `${SERVICE_NAME}_session`,
      });
    } catch (error) {
      console.error('Lỗi khi xóa session:', error);
    }
  },

  /**
   * Lấy số điện thoại đã lưu để auto-fill
   * @returns Phone number hoặc null
   */
  async getPhone(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: `${SERVICE_NAME}_phone`,
      });
      if (credentials) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Lỗi khi lấy phone:', error);
      return null;
    }
  },

  /**
   * Lưu số điện thoại để auto-fill lần sau
   * @param phone - Số điện thoại đã format (e.g. "+84376340112")
   */
  async setPhone(phone: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(KEYS.PHONE, phone, {
        service: `${SERVICE_NAME}_phone`,
      });
    } catch (error) {
      console.error('Lỗi khi lưu phone:', error);
    }
  },

  /**
   * Kiểm tra xem có session hay không
   * @returns true nếu có session token
   */
  async hasSession(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null && session.length > 0;
  },
};
