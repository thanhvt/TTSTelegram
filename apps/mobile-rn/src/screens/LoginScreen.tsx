/**
 * Login Screen - Màn hình đăng nhập Telegram
 *
 * @description Nhập số điện thoại để nhận OTP
 * @flow User nhập phone → Gọi sendCode API → Chuyển đến OTP screen
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../stores/appStore';
import { authApi } from '../services/api';
import { RootStackParamList } from '../navigation/types';
import { spacing, borderRadius, touchTarget, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// DEBUG: Hardcode số điện thoại để test nhanh
const DEBUG_PHONE = '376340112';
const AUTO_SUBMIT_DELAY = 3000; // 3 giây

export default function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const { phoneNumber, setPhoneNumber, setAuthStatus } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const submitRef = useRef<() => void>();

  // DEBUG: Auto fill và auto submit sau 3s
  useEffect(() => {
    // Set số điện thoại mặc định
    setPhoneNumber(DEBUG_PHONE);

    // Countdown hiển thị
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto submit sau 3s
    const submitTimer = setTimeout(() => {
      if (submitRef.current) {
        submitRef.current();
      }
    }, AUTO_SUBMIT_DELAY);

    return () => {
      clearInterval(countdownTimer);
      clearTimeout(submitTimer);
    };
  }, [setPhoneNumber]);

  /**
   * Xử lý gửi mã OTP
   * 
   * @description Validate số điện thoại (9-10 số, không bắt buộc số 0 đầu) và gửi mã xác thực
   * @flow User nhập phone → validate → format với +84 → gọi API → chuyển màn hình OTP
   */
  const handleSendCode = async () => {
    // Prevent double submit
    if (isLoading) return;

    // Validate phone: chấp nhận 9-10 số (có hoặc không có số 0 đầu)
    const cleanPhone = phoneNumber.replace(/^0/, ''); // Bỏ số 0 đầu nếu có
    if (!phoneNumber || cleanPhone.length < 9) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại hợp lệ (9-10 số)');
      return;
    }

    // Format phone với country code nếu chưa có
    const formattedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+84${phoneNumber.replace(/^0/, '')}`;

    setIsLoading(true);

    // Thông báo nếu server đang ngủ (Render Free Tier)
    const wakeupTimer = setTimeout(() => {
      Alert.alert(
        'Server đang khởi động',
        'Server đang thức dậy từ trạng thái nghỉ (Free Tier), quá trình này có thể mất khoảng 1 phút. Vui lòng kiên nhẫn đợi...'
      );
    }, 5000);

    try {
      await authApi.sendCode(formattedPhone);
      setAuthStatus('awaiting_code');
      navigation.navigate('OTP', { phoneNumber: formattedPhone });
    } catch (error) {
      Alert.alert(
        'Lỗi gửi mã',
        error instanceof Error ? error.message : 'Có lỗi xảy ra, vui lòng thử lại'
      );
    } finally {
      clearTimeout(wakeupTimer);
      setIsLoading(false);
    }
  };

  // Lưu reference để auto submit
  submitRef.current = handleSendCode;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo & Title */}
        <View style={styles.header}>
          <Text style={[styles.emoji]}>🎧</Text>
          <Text style={[styles.title, { color: theme.text }]}>TTS Reader</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Đăng nhập bằng Telegram
          </Text>
        </View>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.countryCode, { color: theme.text }]}>🇻🇳 +84</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Số điện thoại"
              placeholderTextColor={theme.textSecondary}
              value={phoneNumber.replace(/^\+84/, '')}
              onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
              keyboardType="phone-pad"
              autoFocus
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleSendCode}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {countdown > 0 ? `Tiếp tục (${countdown})` : 'Tiếp tục →'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Helper Text */}
        <Text style={[styles.helperText, { color: theme.textSecondary }]}>
          Mã xác thực sẽ được gửi đến Telegram của bạn
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    height: touchTarget.comfortable,
  },
  countryCode: {
    ...typography.body,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    paddingVertical: 0,
    textAlignVertical: 'center', // Android
    includeFontPadding: false, // Android
  },
  button: {
    height: touchTarget.comfortable,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.button,
    color: '#fff',
  },
  helperText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});
