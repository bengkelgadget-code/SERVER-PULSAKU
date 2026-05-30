import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, StatusBar, KeyboardAvoidingView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { PROVIDERS, detectProvider, getProductsByBrand, PulsaProduct } from '@/services/product.service';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

export default function PaketDataScreen() {
  const router = useRouter();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();

  const [phone, setPhone] = useState('');
  const [packages, setPackages] = useState<PulsaProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const provider = PROVIDERS.find(p => p.id === providerId) ?? detectProvider(phone);

  useEffect(() => {
    if (provider) {
      loadPackages(provider.id);
    }
  }, [provider?.id]);

  const loadPackages = async (brand: string) => {
    setIsLoading(true);
    try {
      const data = await getProductsByBrand(brand);
      setPackages(data);
    } catch (error) {
      console.error('Error loading packages:', error);
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = (pkg: PulsaProduct) => {
    if (phone.length < 9) {
      Alert.alert('Peringatan', 'Masukkan nomor HP terlebih dahulu');
      return;
    }
    Alert.alert(
      'Konfirmasi Pembelian',
      `${pkg.product_name}\nUntuk: ${phone}\nHarga transaksi: Rp ${pkg.harga_jual.toLocaleString('id-ID')}`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Beli',
          onPress: () => {
            Alert.alert('Info', 'Sistem paket data sedang dalam pengembangan. Gunakan menu Pulsa untuk transaksi.');
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={Colors.gradientAccent} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Paket Data {provider?.name ?? ''}
          </Text>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => provider && loadPackages(provider.id)}>
            <Ionicons name="refresh-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Input card */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Nomor HP</Text>
            <View style={[styles.inputWrapper, phone.length > 0 && styles.inputActive]}>
              {provider ? (
                <View style={[styles.providerBadge, { backgroundColor: provider.color + '18' }]}>
                  <Text style={{ fontSize: 18 }}>{provider.icon}</Text>
                </View>
              ) : (
                <Ionicons name="call-outline" size={20} color={Colors.gray400} style={{ marginRight: 8 }} />
              )}
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Masukkan nomor HP"
                placeholderTextColor={Colors.gray400}
                keyboardType="phone-pad"
                maxLength={15}
              />
              {phone.length > 0 && (
                <TouchableOpacity onPress={() => setPhone('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.gray400} />
                </TouchableOpacity>
              )}
            </View>
            {provider && (
              <View style={[styles.providerChip, { backgroundColor: provider.color + '15' }]}>
                <Ionicons name="checkmark-circle" size={14} color={provider.color} />
                <Text style={[styles.providerChipText, { color: provider.color }]}>{provider.name} terdeteksi</Text>
              </View>
            )}
          </View>

          {/* Data packages */}
          <Text style={styles.sectionTitle}>Pilih Paket Data</Text>

          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.loadingText}>Memuat paket data...</Text>
            </View>
          ) : packages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wifi-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>Belum ada paket data</Text>
              <Text style={styles.emptySubtitle}>Paket data untuk operator ini belum tersedia</Text>
            </View>
          ) : (
            <View style={styles.packageGrid}>
              {packages.map(pkg => (
                <TouchableOpacity
                  key={pkg.sku_code}
                  style={styles.packageCard}
                  activeOpacity={0.8}
                  onPress={() => handleBuy(pkg)}
                >
                  <Ionicons name="wifi" size={28} color={Colors.accent} style={{ marginBottom: 8 }} />
                  <Text style={styles.pkgName}>{pkg.product_name}</Text>
                  <Text style={styles.pkgPrice}>Rp {pkg.harga_jual.toLocaleString('id-ID')}</Text>
                  <LinearGradient colors={Colors.gradientAccent} style={styles.pkgBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.pkgBtnText}>Beli</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: STATUS_BAR_HEIGHT + 8, paddingBottom: 16, paddingHorizontal: Spacing.md },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { color: '#fff', fontSize: FontSize.lg, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  content: { padding: Spacing.md },
  inputCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.lg },
  inputLabel: { color: Colors.gray500, fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: Platform.OS === 'ios' ? 14 : 10, backgroundColor: Colors.gray50, marginBottom: Spacing.sm },
  inputActive: { borderColor: Colors.accent, backgroundColor: Colors.accentBg },
  providerBadge: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  textInput: { flex: 1, color: Colors.black, fontSize: FontSize.lg, fontWeight: '600', padding: 0 },
  providerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, alignSelf: 'flex-start' },
  providerChipText: { fontSize: FontSize.sm, fontWeight: '600' },

  sectionTitle: { color: Colors.black, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.sm },

  loadingState: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { color: Colors.gray500, fontSize: FontSize.sm, marginTop: Spacing.sm },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: Colors.black, fontSize: FontSize.lg, fontWeight: '700', marginTop: Spacing.md, marginBottom: Spacing.xs },
  emptySubtitle: { color: Colors.gray500, fontSize: FontSize.sm, textAlign: 'center' },

  packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  packageCard: { width: '47%', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', position: 'relative', overflow: 'hidden', ...Shadow.sm },
  pkgName: { color: Colors.black, fontSize: FontSize.sm, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  pkgPrice: { color: Colors.accent, fontSize: FontSize.md, fontWeight: '800', marginBottom: 10 },
  pkgBtn: { borderRadius: Radius.full, paddingHorizontal: 20, paddingVertical: 7, width: '100%', alignItems: 'center' },
  pkgBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
});
