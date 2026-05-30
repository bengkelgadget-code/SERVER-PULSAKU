'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Platform, StatusBar, TextInput, KeyboardAvoidingView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { PROVIDERS, detectProvider, getProductsByBrand, searchProducts, PulsaProduct } from '@/services/product.service';
import { supabase } from '@/lib/supabase';

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  item,
  provider,
  onPress,
}: {
  item: PulsaProduct;
  provider: { color: string; icon: string; name: string } | null;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.productCard, Shadow.sm]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.productIcon,
          { backgroundColor: (provider?.color ?? Colors.primary) + '18' },
        ]}
      >
        <Text style={{ fontSize: 26 }}>{provider?.icon ?? '📱'}</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.product_name}
        </Text>
        <Text style={styles.productProvider}>{provider?.name ?? 'Operator'}</Text>
        <Text style={styles.productDesc}>Aktif instan</Text>
      </View>
      <View style={styles.productPriceCol}>
        <Text style={styles.productPriceValue}>
          Rp {item.harga_jual.toLocaleString('id-ID')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Confirm Purchase Modal ────────────────────────────────────────────────────

function PurchaseConfirmModal({
  visible,
  product,
  phone,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  product: PulsaProduct | null;
  phone: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!visible || !product) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>Konfirmasi Pembelian</Text>

        <View style={styles.modalDetailRow}>
          <Text style={styles.modalLabel}>Produk</Text>
          <Text style={styles.modalValue}>{product.product_name}</Text>
        </View>
        <View style={styles.modalDetailRow}>
          <Text style={styles.modalLabel}>Nomor Tujuan</Text>
          <Text style={styles.modalValue}>{phone}</Text>
        </View>
        <View style={styles.modalDetailRow}>
          <Text style={styles.modalLabel}>Harga</Text>
          <Text style={[styles.modalValue, styles.modalPrice]}>
            Rp {product.harga_jual.toLocaleString('id-ID')}
          </Text>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalBtnCancel} onPress={onClose}>
            <Text style={styles.modalBtnCancelText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalBtnConfirm} onPress={onConfirm}>
            <Text style={styles.modalBtnConfirmText}>Beli Sekarang</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PulsaScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<PulsaProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PulsaProduct | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const provider = detectProvider(phone);

  // Load products when provider is detected
  useEffect(() => {
    if (provider) {
      loadProducts(provider.id);
    } else {
      setProducts([]);
    }
  }, [provider?.id]);

  const loadProducts = async (brand: string) => {
    setIsLoading(true);
    try {
      const data = await getProductsByBrand(brand);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search
  const filtered = products.filter(
    p =>
      search === '' ||
      p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleBuy = (product: PulsaProduct) => {
    setSelectedProduct(product);
    setIsPurchasing(false);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedProduct || !phone) return;

    setIsPurchasing(true);

    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        Alert.alert('Error', 'Sesi habis. Silakan login ulang.');
        return;
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_APP_URL || 'https://placeholder.app'}/api/mobile/transaction/purchase`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            sku_code: selectedProduct.sku_code,
            customer_no: phone,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Gagal', data.error || 'Terjadi kesalahan');
        setIsPurchasing(false);
        setSelectedProduct(null);
        return;
      }

      setIsPurchasing(false);
      setSelectedProduct(null);
      setPhone('');
      setSearch('');
      setProducts([]);

      if (data.success) {
        Alert.alert(
          data.status === 'sukses' ? 'Berhasil' : 'Menunggu',
          data.status === 'sukses'
            ? `Pembelian berhasil!\nSN: ${data.sn || '-'}`
            : 'Transaksi sedang diproses. Cek riwayat untuk update.',
          [{ text: 'OK', onPress: () => router.push('/(tabs)/transaksi') }]
        );
      } else {
        Alert.alert('Gagal', data.error || 'Transaksi gagal.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setIsPurchasing(false);
      setSelectedProduct(null);
      Alert.alert('Error', 'Tidak bisa terhubung ke server.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        {/* ── Header ── */}
        <LinearGradient
          colors={Colors.gradientPrimary}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pulsa Nasional</Text>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => provider && loadProducts(provider.id)}
          >
            <Ionicons name="refresh-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Sticky Top: Phone Input + Search ── */}
        <View style={styles.stickyTop}>
          <TouchableOpacity
            style={[styles.phoneInputWrapper, phone.length > 0 && styles.phoneInputActive]}
            onPress={() => inputRef.current?.focus()}
            activeOpacity={1}
          >
            <View style={styles.phoneInputLabel}>
              <Text style={styles.phoneInputLabelText}>NOMOR HP</Text>
            </View>

            <View style={styles.phoneInputRow}>
              {provider ? (
                <View
                  style={[styles.operatorBadge, { backgroundColor: provider.color + '18' }]}
                >
                  <Text style={{ fontSize: 20 }}>{provider.icon}</Text>
                </View>
              ) : (
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={Colors.gray400}
                  style={{ marginRight: 8 }}
                />
              )}

              <TextInput
                ref={inputRef}
                style={styles.phoneInput}
                value={phone}
                onChangeText={text => {
                  setPhone(text);
                  setSearch('');
                }}
                placeholder="Ketik nomor HP..."
                placeholderTextColor={Colors.gray400}
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
              />

              {phone.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setPhone('');
                    setSearch('');
                    setProducts([]);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.gray400} />
                </TouchableOpacity>
              )}
            </View>

            {provider && (
              <View style={[styles.providerChip, { backgroundColor: provider.color + '15' }]}>
                <Ionicons name="checkmark-circle" size={14} color={provider.color} />
                <Text style={[styles.providerChipText, { color: provider.color }]}>
                  {provider.name} terdeteksi
                </Text>
              </View>
            )}

            <View style={styles.quickChips}>
              {[
                { icon: 'mic-outline' as const, label: 'Bicara' },
                { icon: 'qr-code-outline' as const, label: 'Barcode' },
                { icon: 'heart-outline' as const, label: 'Favorit' },
              ].map(chip => (
                <TouchableOpacity key={chip.label} style={styles.chip}>
                  <Ionicons name={chip.icon} size={13} color={Colors.gray600} />
                  <Text style={styles.chipLabel}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>

          {provider && (
            <>
              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <Ionicons name="search-outline" size={15} color={Colors.gray400} />
                  <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={searchTerm => {
                      setSearch(searchTerm);
                      if (searchTerm) {
                        searchProducts(provider.id, searchTerm).then(setProducts);
                      } else {
                        getProductsByBrand(provider.id).then(setProducts);
                      }
                    }}
                    placeholder="Cari nominal..."
                    placeholderTextColor={Colors.gray400}
                  />
                </View>
                <TouchableOpacity style={styles.filterBtn}>
                  <Ionicons name="options-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeaderTitle}>Pilihan Pulsa</Text>
                <Text style={styles.listHeaderCount}>{filtered.length} produk</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Product List ── */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.sku_code}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Memuat produk...</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name={phone.length >= 4 && !provider ? 'search-outline' : 'phone-portrait-outline'}
                    size={48}
                    color={Colors.gray300}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {phone.length >= 4 && !provider
                    ? 'Operator tidak dikenali'
                    : 'Masukkan nomor HP'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {phone.length >= 4 && !provider
                    ? 'Coba periksa kembali nomor yang dimasukkan'
                    : 'Ketik nomor HP di atas untuk melihat produk yang tersedia'}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              provider={provider}
              onPress={() => handleBuy(item)}
            />
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </View>

      {/* ── Purchase Confirm Modal ── */}
      {isPurchasing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingCardText}>Memproses pembelian...</Text>
          </View>
        </View>
      )}

      <PurchaseConfirmModal
        visible={!!selectedProduct && !isPurchasing}
        product={selectedProduct}
        phone={phone}
        onClose={() => setSelectedProduct(null)}
        onConfirm={handleConfirmPurchase}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STATUS_BAR_HEIGHT =
  Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: STATUS_BAR_HEIGHT + 8,
    paddingBottom: 16,
    paddingHorizontal: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerBtn: {
    width: 36,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stickyTop: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  phoneInputWrapper: {
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.gray50,
  },
  phoneInputActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  phoneInputLabel: { marginBottom: 6 },
  phoneInputLabelText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  phoneInputRow: { flexDirection: 'row', alignItems: 'center' },
  operatorBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    color: Colors.black,
    fontSize: FontSize.xl,
    fontWeight: '700',
    padding: 0,
  },

  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: 8,
  },
  providerChipText: { fontSize: FontSize.xs, fontWeight: '700', marginLeft: 4 },

  quickChips: { flexDirection: 'row', marginTop: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginRight: 8,
  },
  chipLabel: { color: Colors.gray600, fontSize: 11, fontWeight: '600', marginLeft: 4 },

  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.black,
    fontSize: FontSize.sm,
    marginLeft: 6,
    padding: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md,
  },

  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  listHeaderTitle: { color: Colors.black, fontSize: FontSize.md, fontWeight: '700' },
  listHeaderCount: { color: Colors.gray400, fontSize: FontSize.sm },

  listContent: { padding: Spacing.md },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: 10,
  },
  productIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  productInfo: { flex: 1 },
  productName: {
    color: Colors.black,
    fontSize: FontSize.md,
    fontWeight: '700',
    flex: 1,
    marginBottom: 2,
  },
  productProvider: { color: Colors.gray500, fontSize: FontSize.xs, marginBottom: 2 },
  productDesc: { color: Colors.gray400, fontSize: FontSize.xs },
  productPriceCol: { alignItems: 'flex-end', marginLeft: 8 },
  productPriceValue: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },

  loadingState: { alignItems: 'center', paddingTop: 60 },
  loadingText: { color: Colors.gray500, fontSize: FontSize.sm, marginTop: Spacing.sm },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { color: Colors.black, fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm },
  emptySubtitle: { color: Colors.gray500, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },

  // Modal
  modalOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: '100%',
  },
  modalTitle: {
    color: Colors.black, fontSize: FontSize.xl, fontWeight: '800',
    textAlign: 'center', marginBottom: Spacing.lg,
  },
  modalDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modalLabel: { color: Colors.gray500, fontSize: 13, fontWeight: '600' },
  modalValue: { color: Colors.black, fontSize: 13, fontWeight: '700', textAlign: 'right', flex: 1 },
  modalPrice: { color: Colors.accent, fontSize: 18 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: Spacing.md },
  modalBtnCancel: { flex: 1, backgroundColor: Colors.gray100, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  modalBtnCancelText: { color: Colors.gray600, fontSize: FontSize.md, fontWeight: '700' },
  modalBtnConfirm: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  modalBtnConfirmText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  // Loading overlay
  loadingOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 12,
    minWidth: 160,
  },
  loadingCardText: { color: Colors.black, fontSize: FontSize.sm, fontWeight: '700' },
});
