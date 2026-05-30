import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { login } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi';
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    const result = await login({ email: email.trim(), password });

    if (result.success) {
      // Await refreshUser BEFORE navigating so user data is fresh in context
      await refreshUser();
      router.replace('/');
    } else {
      setErrors({ general: result.error || 'Login gagal. Silakan coba lagi.' });
    }

    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={Colors.gradientPrimary}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="storefront" size={40} color="#fff" />
              </View>
              <Text style={styles.appName}>Konter Mobile</Text>
              <Text style={styles.tagline}>Solusi lengkap untuk kebutuhan digital Anda</Text>
            </View>
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Selamat Datang!</Text>
            <Text style={styles.subtitle}>Masuk untuk melanjutkan</Text>

            {errors.general && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan email"
                  placeholderTextColor={Colors.gray400}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle" size={12} color={Colors.error} /> {errors.email}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan password"
                  placeholderTextColor={Colors.gray400}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.gray400}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle" size={12} color={Colors.error} /> {errors.password}
                </Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Lupa password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Masuk</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Belum punya akun?</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity disabled={isLoading}>
                  <Text style={styles.registerLink}>Daftar sekarang</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoContainer: { alignItems: 'center' },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: { color: '#fff', fontSize: FontSize.xxl, fontWeight: '800', marginBottom: 4 },
  tagline: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, textAlign: 'center' },
  formContainer: { padding: Spacing.lg, marginTop: -20 },
  welcomeText: { color: Colors.black, fontSize: FontSize.xxl, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: Colors.gray500, fontSize: FontSize.md, marginBottom: Spacing.lg },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorBannerText: { color: Colors.error, fontSize: FontSize.sm, flex: 1 },
  inputGroup: { marginBottom: Spacing.md },
  label: { color: Colors.gray700, fontSize: FontSize.sm, fontWeight: '600', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    paddingHorizontal: Spacing.sm,
  },
  inputError: { borderColor: Colors.error },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.black, fontSize: FontSize.md, paddingVertical: 14 },
  passwordToggle: { padding: 8 },
  errorText: { color: Colors.error, fontSize: FontSize.xs, marginTop: 4 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: Spacing.lg },
  forgotPasswordText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray200 },
  dividerText: { color: Colors.gray400, fontSize: FontSize.sm, marginHorizontal: Spacing.md },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  registerText: { color: Colors.gray500, fontSize: FontSize.sm },
  registerLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
});
