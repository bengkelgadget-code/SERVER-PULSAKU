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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { register } from '@/services/auth.service';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Nama minimal 2 karakter';
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (result.success) {
      router.replace('/');
    } else {
      setErrors({ general: result.error || 'Registrasi gagal. Silakan coba lagi.' });
    }
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
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </Link>
            <View style={styles.headerContent}>
              <View style={styles.logoCircle}>
                <Ionicons name="person-add" size={36} color="#fff" />
              </View>
              <Text style={styles.title}>Daftar Akun Baru</Text>
              <Text style={styles.subtitle}>Buat akun untuk mulai menggunakan aplikasi</Text>
            </View>
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            {errors.general && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            )}

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor={Colors.gray400}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
              {errors.name && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle" size={12} color={Colors.error} /> {errors.name}
                </Text>
              )}
            </View>

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
                  placeholder="Minimal 6 karakter"
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

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Konfirmasi Password</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan password lagi"
                  placeholderTextColor={Colors.gray400}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.gray400}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle" size={12} color={Colors.error} /> {errors.confirmPassword}
                </Text>
              )}
            </View>

            {/* Terms */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                Dengan mendaftar, Anda menyetujui{' '}
                <Text style={styles.termsLink}>Syarat & Ketentuan</Text> dan{' '}
                <Text style={styles.termsLink}>Kebijakan Privasi</Text> kami
              </Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Daftar</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Sudah punya akun?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity disabled={isLoading}>
                  <Text style={styles.loginLink}>Masuk</Text>
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
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  headerContent: { alignItems: 'center' },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: { color: '#fff', fontSize: FontSize.xxl, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, textAlign: 'center' },
  formContainer: { padding: Spacing.lg, marginTop: -20 },
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
  termsContainer: { marginBottom: Spacing.lg },
  termsText: { color: Colors.gray500, fontSize: FontSize.xs, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: Colors.primary, fontWeight: '600' },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  registerButtonDisabled: { opacity: 0.7 },
  registerButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  loginText: { color: Colors.gray500, fontSize: FontSize.sm },
  loginLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
});