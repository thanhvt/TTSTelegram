/**
 * LoginForm - Form đăng nhập Telegram
 *
 * @description Xử lý flow: nhập SĐT → nhập OTP → nhập 2FA (nếu có)
 */

import { useState } from 'react';
import { Phone, Key, Lock, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAppStore, AuthStatus } from '../stores/appStore';

export function LoginForm() {
  const { authStatus, setAuthStatus, phoneNumber, setPhoneNumber } = useAppStore();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Gửi mã OTP đến số điện thoại
   */
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.sendCode(phoneNumber);
      setAuthStatus('awaiting_code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi mã');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Xác nhận mã OTP và đăng nhập
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.signIn(phoneNumber, code, password || undefined);
      setAuthStatus('connected');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      
      // Kiểm tra nếu cần 2FA
      if (errorMessage.includes('2FA')) {
        setAuthStatus('awaiting_2fa');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Đã đăng nhập
  if (authStatus === 'connected') {
    return (
      <div className="card text-center py-8">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Đã kết nối Telegram!</h2>
        <p className="text-gray-400">Bạn có thể chọn groups để đọc tin nhắn</p>
      </div>
    );
  }

  return (
    <div className="card max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-white">Đăng nhập Telegram</h2>
        <p className="text-gray-400 text-sm mt-1">
          {authStatus === 'awaiting_phone' && 'Nhập số điện thoại để nhận mã xác thực'}
          {authStatus === 'awaiting_code' && 'Nhập mã OTP đã gửi đến Telegram của bạn'}
          {authStatus === 'awaiting_2fa' && 'Nhập mật khẩu hai lớp (2FA)'}
        </p>
      </div>

      {error && (
        <div className="bg-error/20 text-error px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Form nhập số điện thoại */}
      {authStatus === 'awaiting_phone' && (
        <form onSubmit={handleSendCode}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Số điện thoại
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+84 xxx xxx xxx"
                className="input pl-10"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !phoneNumber}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Key className="w-5 h-5" />
                Gửi mã xác thực
              </>
            )}
          </button>
        </form>
      )}

      {/* Form nhập OTP */}
      {authStatus === 'awaiting_code' && (
        <form onSubmit={handleSignIn}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mã OTP
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Nhập mã 5-6 số"
                className="input pl-10 text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length < 5}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Xác nhận
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAuthStatus('awaiting_phone')}
            className="btn-ghost w-full mt-2 text-sm"
          >
            ← Quay lại
          </button>
        </form>
      )}

      {/* Form nhập 2FA */}
      {authStatus === 'awaiting_2fa' && (
        <form onSubmit={handleSignIn}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mật khẩu hai lớp (2FA)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu 2FA"
                className="input pl-10"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Đăng nhập
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAuthStatus('awaiting_code')}
            className="btn-ghost w-full mt-2 text-sm"
          >
            ← Quay lại
          </button>
        </form>
      )}
    </div>
  );
}
