/**
 * OTP Screen - Màn hình nhập mã xác thực
 *
 * @description Nhập OTP 5-6 số từ Telegram để hoàn tất đăng nhập
 * @flow User nhập OTP → Gọi signIn API → Lưu session → Chuyển đến Main
 */

import React, { useState, useRef } from 'react';
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
import { authStore } from '../stores/authStore';
import { authApi } from '../services/api';
import { RootStackParamList } from '../navigation/types';
import { spacing, borderRadius, touchTarget, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OTP'>;

export default function OTPScreen({ navigation, route }: Props) {
  const { phoneNumber } = route.params;
  const theme = useTheme();
  const { setAuthStatus } = useAppStore();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  /**
   * Xử lý xác thực OTP
   */
  const handleVerify = async () => {
    if (!code || code.length < 5) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã xác thực');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.signIn(phoneNumber, code);

      // Lưu session vào SecureStore
      await authStore.setSession(result.sessionString);
      await authStore.setPhone(phoneNumber);

      // Cập nhật auth status
      setAuthStatus('connected');

      // Navigation sẽ tự động chuyển sang MainTabs do conditional rendering
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';

      // Check nếu cần 2FA
      if (message.includes('2FA') || message.includes('password')) {
        setAuthStatus('awaiting_2fa');
        // TODO: Navigate to 2FA screen
        Alert.alert('Yêu cầu 2FA', 'Tài khoản của bạn có bật xác thực 2 bước. Tính năng này sẽ được hỗ trợ sau.');
      } else {
        Alert.alert('Lỗi xác thực', message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.emoji]}>💬</Text>
          <Text style={[styles.title, { color: theme.text }]}>Nhập mã xác thực</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Đã gửi mã đến {phoneNumber}
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[
              styles.codeInput,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="12345"
            placeholderTextColor={theme.textSecondary}
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            editable={!isLoading}
            textAlign="center"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleVerify}
          disabled={isLoading || code.length < 5}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Xác thực</Text>
          )}
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>
            ← Quay lại
          </Text>
        </TouchableOpacity>
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
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    height: touchTarget.large,
    ...typography.h2,
    letterSpacing: 8,
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
  backButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  backButtonText: {
    ...typography.body,
  },
});
