/**
 * 2FA Screen - Màn hình nhập mật khẩu 2FA
 *
 * @description Nhập mật khẩu xác thực 2 bước khi tài khoản yêu cầu
 * @flow User nhập password → Gọi signIn API với password → Lưu session
 */

import React, { useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'TwoFA'>;

export default function TwoFAScreen({ navigation, route }: Props) {
  const { phoneNumber, code } = route.params;
  const theme = useTheme();
  const { setAuthStatus } = useAppStore();

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Xử lý xác thực 2FA
   */
  const handleVerify = async () => {
    if (!password) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu 2FA');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.signIn(phoneNumber, code, password);

      // Lưu session vào SecureStore
      await authStore.setSession(result.sessionString);
      await authStore.setPhone(phoneNumber);

      // Cập nhật auth status
      setAuthStatus('connected');
    } catch (error) {
      Alert.alert(
        'Lỗi xác thực',
        error instanceof Error ? error.message : 'Mật khẩu không đúng'
      );
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
          <Text style={[styles.emoji]}>🔐</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Xác thực 2 bước
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Tài khoản của bạn được bảo vệ bởi mật khẩu 2FA
          </Text>
        </View>

        {/* Password Input */}
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
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Mật khẩu 2FA"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoFocus
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={{ fontSize: 18 }}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleVerify}
          disabled={isLoading || !password}
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
          onPress={() => navigation.navigate('Login')}
          disabled={isLoading}
        >
          <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>
            ← Đăng nhập lại
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    height: touchTarget.comfortable,
  },
  input: {
    flex: 1,
    ...typography.body,
    height: '100%',
  },
  eyeButton: {
    padding: spacing.sm,
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
