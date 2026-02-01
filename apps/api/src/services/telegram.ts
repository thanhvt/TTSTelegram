/**
 * Telegram Service - Kết nối và tương tác với Telegram qua MTProto
 *
 * @description Service wrapper cho thư viện telegram (GramJS)
 * @usage Được sử dụng bởi các routes: auth, dialogs, messages
 */

import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { NewMessage } from 'telegram/events/index.js';

// Types định nghĩa inline (tránh lỗi import từ shared package)
export type AuthStatus = 'disconnected' | 'awaiting_phone' | 'awaiting_code' | 'awaiting_2fa' | 'connected';

export interface TelegramDialog {
  id: string;
  title: string;
  type: 'group' | 'channel' | 'user' | 'megagroup';
  unreadCount: number;
  lastMessage?: string;
  lastMessageDate?: Date;
}

export interface TelegramMessage {
  id: number;
  dialogId: string;
  text: string;
  senderName?: string;
  date: Date;
  isOutgoing: boolean;
}

// Đọc credentials từ environment
const APP_ID = parseInt(process.env.TELEGRAM_APP_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';

/**
 * Singleton class quản lý kết nối Telegram
 */
class TelegramService {
  private client: TelegramClient | null = null;
  private session: StringSession;
  private _status: AuthStatus = 'disconnected';
  private _phoneCodeHash: string = '';

  constructor() {
    // Khôi phục session từ env nếu có
    const savedSession = process.env.SESSION_STRING || '';
    this.session = new StringSession(savedSession);
  }

  /**
   * Lấy trạng thái xác thực hiện tại
   */
  get status(): AuthStatus {
    return this._status;
  }

  /**
   * Lấy session string để lưu trữ
   */
  get sessionString(): string {
    return this.session.save();
  }

  /**
   * Khởi tạo kết nối Telegram client
   *
   * @returns Promise<boolean> - true nếu kết nối thành công
   * @throws Error nếu credentials không hợp lệ
   */
  async connect(): Promise<boolean> {
    if (!APP_ID || !API_HASH) {
      throw new Error('Thiếu TELEGRAM_APP_ID hoặc TELEGRAM_API_HASH trong .env');
    }

    try {
      this.client = new TelegramClient(this.session, APP_ID, API_HASH, {
        connectionRetries: 5,
      });

      await this.client.connect();

      // Kiểm tra xem đã đăng nhập chưa
      const isAuthorized = await this.client.isUserAuthorized();

      if (isAuthorized) {
        this._status = 'connected';
        console.log('✅ Telegram: Đã kết nối với session có sẵn');
      } else {
        this._status = 'awaiting_phone';
        console.log('📱 Telegram: Chờ nhập số điện thoại');
      }

      return isAuthorized;
    } catch (error) {
      console.error('❌ Telegram: Lỗi kết nối:', error);
      this._status = 'disconnected';
      throw error;
    }
  }

  /**
   * Gửi mã xác thực đến số điện thoại
   *
   * @param phoneNumber - Số điện thoại (format: +84xxxxxxxxx)
   * @returns Promise<void>
   */
  async sendCode(phoneNumber: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client chưa được khởi tạo. Gọi connect() trước.');
    }

    try {
      const result = await this.client.sendCode(
        { apiId: APP_ID, apiHash: API_HASH },
        phoneNumber
      );

      this._phoneCodeHash = result.phoneCodeHash;
      this._status = 'awaiting_code';
      console.log('📨 Telegram: Đã gửi mã xác thực đến', phoneNumber);
    } catch (error) {
      console.error('❌ Telegram: Lỗi gửi mã:', error);
      throw error;
    }
  }

  /**
   * Xác nhận mã OTP và đăng nhập
   *
   * @param phoneNumber - Số điện thoại
   * @param code - Mã OTP nhận được
   * @param password - Mật khẩu 2FA (nếu có)
   * @returns Promise<string> - Session string để lưu trữ
   */
  async signIn(
    phoneNumber: string,
    code: string,
    password?: string
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Client chưa được khởi tạo');
    }

    try {
      await this.client.invoke(
        new Api.auth.SignIn({
          phoneNumber,
          phoneCodeHash: this._phoneCodeHash,
          phoneCode: code,
        })
      );

      this._status = 'connected';
      console.log('✅ Telegram: Đăng nhập thành công');
      return this.session.save();
    } catch (error: unknown) {
      // Xử lý yêu cầu 2FA
      if (error instanceof Error && error.message.includes('SESSION_PASSWORD_NEEDED')) {
        if (!password) {
          this._status = 'awaiting_2fa';
          throw new Error('Tài khoản yêu cầu mật khẩu 2FA');
        }

        // Đăng nhập với 2FA
        await this.client.signInWithPassword(
          { apiId: APP_ID, apiHash: API_HASH },
          {
            password: async () => password,
            onError: (err) => {
              throw err;
            },
          }
        );

        this._status = 'connected';
        return this.session.save();
      }

      throw error;
    }
  }

  /**
   * Lấy danh sách các dialog (groups, channels, chats)
   *
   * @param limit - Số lượng tối đa cần lấy
   * @returns Promise<TelegramDialog[]>
   */
  async getDialogs(limit: number = 50): Promise<TelegramDialog[]> {
    if (!this.client || this._status !== 'connected') {
      throw new Error('Chưa đăng nhập Telegram');
    }

    const dialogs = await this.client.getDialogs({ limit });

    return dialogs.map((dialog) => {
      let type: TelegramDialog['type'] = 'user';

      if (dialog.isChannel) {
        type = 'channel';
      } else if (dialog.isGroup) {
        type = dialog.entity?.className === 'Channel' ? 'megagroup' : 'group';
      }

      return {
        id: dialog.id?.toString() || '',
        title: dialog.title || 'Unknown',
        type,
        unreadCount: dialog.unreadCount || 0,
        lastMessage: dialog.message?.message,
        lastMessageDate: dialog.message?.date
          ? new Date(dialog.message.date * 1000)
          : undefined,
      };
    });
  }

  /**
   * Lấy tin nhắn từ một dialog cụ thể
   *
   * @param dialogId - ID của dialog
   * @param limit - Số lượng tin nhắn cần lấy
   * @returns Promise<TelegramMessage[]>
   */
  async getMessages(
    dialogId: string,
    limit: number = 100
  ): Promise<TelegramMessage[]> {
    if (!this.client || this._status !== 'connected') {
      throw new Error('Chưa đăng nhập Telegram');
    }

    const entity = await this.client.getEntity(dialogId);
    const messages = await this.client.getMessages(entity, { limit });

    return messages
      .filter((msg) => msg.message) // Chỉ lấy tin nhắn có text
      .map((msg) => ({
        id: msg.id,
        dialogId,
        text: msg.message || '',
        senderName: this.getSenderName(msg),
        date: new Date(msg.date * 1000),
        isOutgoing: msg.out || false,
      }));
  }

  /**
   * Lấy tên người gửi từ message
   */
  private getSenderName(msg: Api.Message): string {
    if (msg.fromId) {
      // TODO: Cache sender info để tránh gọi API nhiều lần
      return 'Unknown';
    }
    return 'Unknown';
  }

  /**
   * Đăng xuất và xóa session
   */
  async logout(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
    }
    this.session = new StringSession('');
    this._status = 'disconnected';
    console.log('👋 Telegram: Đã đăng xuất');
  }
}

// Export singleton instance
export const telegramService = new TelegramService();
