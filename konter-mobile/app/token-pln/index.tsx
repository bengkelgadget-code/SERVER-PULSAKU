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
import { getProductsByCategory, PulsaProduct } from '@/services/product.service';
import { supabase } from '@/lib/supabase';

function ProductCard({ item, onPress }: { item: PulsaProduct; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.productCard, Shadow.sm]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.productIcon, { backgroundColor: Colors.warning + '18' }]}>
        <Ionicons name="flash" size={26} color={Colors.warning} />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.product_name}</Text>
        <Text style={styles.productDesc}>Token listrik instan</Text>
      </View>
      <View style={styles.productPriceCol}>
        <Text style={styles.productPriceValue}>
          Rp {item.harga_jual.toLocaleString('id-ID')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function PurchaseModal({
  visible, product, meterNo, onClose, onConfirm,
}: {
  visible: boolean;
  product: PulsaProduct | null;
  meterNo: string;
  customerName: string;
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
          <Text style={styles.modalLabel}>No. Meter</Text>
          <Text style={styles.modalValue}>{meterNo}</Text>
        </View>
        {customerName ? (
          <View style={styles.modalDetailRow}>
            <Text style={styles.modalLabel}>Nama Pemilik</Text>
            <Text style={styles.modalValue}>{customerName.replace('⚠ ', '')}</Text>
          </View>
        ) : null}
        <View style={[styles.modalDetailRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.modalLabel}>Total Bayar</Text>
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

export default function TokenPlnScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [meterNo, setMeterNo] = useState('');
  const [products, setProducts] = useState<PulsaProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PulsaProduct | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [isCheckingMeter, setIsCheckingMeter] = useState(false);

  // Load PLN products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // PLN Token has category 'PLN' or 'Tagihan Listrik'
      const data = await getProductsByCategory('PLN');
      if (data.length === 0) {
        // Fallback: try to get all products and filter for PLN-related ones
        const all = await getProductsByCategory('Tagihan Listrik');
        setProducts(all.length > 0 ? all : data);
      } else {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error loading PLN products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkMeter = async () => {
      if (meterNo.length >= 11) {
        setIsCheckingMeter(true);
        setCustomerName('');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            setCustomerName('⚠ Sesi login berakhir');
            return;
          }

          const apiUrl = `${process.env.EXPO_PUBLIC_APP_URL || 'https://server-pulsaku.vercel.app'}/api/mobile/transaction/inquiry-pln`;
          console.log('Calling inquiry PLN:', apiUrl, 'customer_no:', meterNo);

          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ customer_no: meterNo }),
          });

          const text = await res.text();
          console.log('Inquiry PLN raw response:', res.status, text);

          try {
            const data = JSON.parse(text);
            if (data.success && data.name) {
              setCustomerName(data.name + (data.segment_power ? ` / ${data.segment_power} VA` : ''));
            } else {
              setCustomerName('⚠ Nomor tidak ditemukan');
            }
          } catch (parseErr) {
            console.error('Failed to parse inquiry response:', parseErr);
            setCustomerName('⚠ Gagal memproses');
          }
        } catch (err) {
          console.error('Check meter error:', err);
          setCustomerName('⚠ Gagal terhubung ke server');
        } finally {
          setIsCheckingMeter(false);
        }
      } else {
        setCustomerName('');
      }
    };

    const timeout = setTimeout(checkMeter, 1000);
    return () => clearTimeout(timeout);
  }, [meterNo]);

  const handleBuy = (product: PulsaProduct) => {
    if (meterNo.length < 6) {
      Alert.alert('Peringatan', 'Masukkan nomor meter terlebih dahulu (minimal 6 digit)');
      return;
    }
    setSelectedProduct(product);
  };

  const [successData, setSuccessData] = useState<any>(null);

  const handleConfirmPurchase = async () => {
    if (!selectedProduct || !meterNo) return;

    setIsPurchasing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        Alert.alert('Error', 'Sesi habis. Silakan login ulang.');
        setIsPurchasing(false);
        setSelectedProduct(null);
        return;
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_APP_URL || 'https://server-pulsaku.vercel.app'}/api/mobile/transaction/purchase`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            sku_code: selectedProduct.sku_code,
            customer_no: meterNo,
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
      
      if (data.success) {
        if (data.status === 'sukses') {
          setSuccessData({
            ...data,
            product: selectedProduct,
            meterNo: meterNo,
            customerName: customerName,
          });
          setSelectedProduct(null);
          // Keep meterNo for now to show on receipt, clear it when modal closes
        } else {
          setSelectedProduct(null);
          setMeterNo('');
          Alert.alert(
            'Menunggu',
            'Transaksi sedang diproses.',
            [{ text: 'OK', onPress: () => router.push('/(tabs)/transaksi') }]
          );
        }
      } else {
        setSelectedProduct(null);
        Alert.alert('Gagal', data.error || 'Transaksi gagal.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setIsPurchasing(false);
      setSelectedProduct(null);
      Alert.alert('Error', 'Tidak bisa terhubung ke server.');
    }
  };

  const handlePrintReceipt = async () => {
    if (!successData) return;
    try {
      const { BluetoothManager, BluetoothEscposPrinter, printReceiptPln } = require('@/utils/printer');
      if (!BluetoothManager) {
        Alert.alert('Gagal', 'Printer tidak didukung di Expo Go. Harap build aplikasi.');
        return;
      }
      
      const isEnabled = await BluetoothManager.isBluetoothEnabled();
      if (!isEnabled) {
        Alert.alert('Bluetooth Mati', 'Mohon nyalakan Bluetooth.');
        return;
      }

      // We assume connected already. In real app we might need to check if it's really connected.
      await printReceiptPln(BluetoothEscposPrinter, {
        idpel: successData.meterNo,
        nama: successData.customerName?.replace('⚠ ', '') || '-',
        trfDaya: 'R1/450', // placeholder, idealy parsed from digiflazz SN or name inquiry
        nominal: `RP. ${successData.product.harga_jual.toLocaleString('id-ID')},00`,
        rpToken: `RP. ${successData.product.harga_jual.toLocaleString('id-ID')},00`,
        jmlKwh: '-',
        admin: 'RP. 0,00',
        total: `RP. ${successData.product.harga_jual.toLocaleString('id-ID')},00`,
        token: successData.sn || 'SEDANG DIPROSES'
      });
      
    } catch (error) {
      console.error('Print Error:', error);
      Alert.alert('Gagal Cetak', 'Pastikan printer bluetooth sudah terhubung.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#F59E0B', '#EF4444']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Token PLN</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={loadProducts}>
            <Ionicons name="refresh-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Meter Input */}
        <View style={styles.stickyTop}>
          <View style={styles.meterCard}>
            <View style={styles.meterLabelRow}>
              <Ionicons name="flash" size={14} color={Colors.warning} />
              <Text style={styles.meterLabel}>NOMOR METER / ID PELANGGAN</Text>
            </View>
            <TextInput
              ref={inputRef}
              style={styles.meterInput}
              value={meterNo}
              onChangeText={setMeterNo}
              placeholder="Contoh: 1234567890123"
              placeholderTextColor={Colors.gray400}
              keyboardType="number-pad"
              maxLength={14}
            />
            {meterNo.length >= 6 && meterNo.length < 11 && (
              <View style={styles.meterHint}>
                <Ionicons name="information-circle" size={14} color={Colors.gray500} />
                <Text style={[styles.meterHintText, { color: Colors.gray500 }]}>Minimal 11 digit untuk cek nama</Text>
              </View>
            )}
            {meterNo.length >= 11 && isCheckingMeter && (
              <View style={styles.meterHint}>
                <ActivityIndicator size="small" color={Colors.warning} style={{ width: 14, height: 14, marginRight: 4 }} />
                <Text style={[styles.meterHintText, { color: Colors.gray500 }]}>Mengecek nama pelanggan...</Text>
              </View>
            )}
            {meterNo.length >= 11 && !isCheckingMeter && customerName ? (
              <View style={styles.meterHint}>
                {customerName.startsWith('⚠') ? (
                  <>
                    <Ionicons name="warning" size={14} color="#F59E0B" />
                    <Text style={[styles.meterHintText, { color: '#F59E0B' }]}>{customerName.replace('⚠ ', '')}</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="person" size={14} color={Colors.accent} />
                    <Text style={[styles.meterHintText, { color: Colors.accent, fontWeight: '700' }]}>{customerName}</Text>
                  </>
                )}
              </View>
            ) : meterNo.length >= 11 && !isCheckingMeter && !customerName ? (
              <View style={styles.meterHint}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
                <Text style={styles.meterHintText}>No. Meter valid ({meterNo.length} digit)</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeaderTitle}>Pilihan Token</Text>
            <Text style={styles.listHeaderCount}>{products.length} produk</Text>
          </View>
        </View>

        {/* Product List */}
        <FlatList
          data={products}
          keyExtractor={item => item.sku_code}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={Colors.warning} />
                <Text style={styles.loadingText}>Memuat token PLN...</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="flash-outline" size={48} color={Colors.gray300} />
                </View>
                <Text style={styles.emptyTitle}>Token PLN belum tersedia</Text>
                <Text style={styles.emptySubtitle}>
                  Pastikan Admin sudah sync produk dari DigiFlazz
                </Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadProducts}>
                  <Ionicons name="refresh" size={16} color={Colors.warning} />
                  <Text style={styles.retryBtnText}>Coba Lagi</Text>
                </TouchableOpacity>
              </View>
            )
          }
          renderItem={({ item }) => (
            <ProductCard item={item} onPress={() => handleBuy(item)} />
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </View>

      {/* Purchase Confirm Modal */}
      {isPurchasing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.warning} />
            <Text style={styles.loadingCardText}>Memproses pembelian...</Text>
          </View>
        </View>
      )}

      <PurchaseModal
        visible={!!selectedProduct && !isPurchasing && !successData}
        product={selectedProduct}
        meterNo={meterNo}
        customerName={customerName}
        onClose={() => setSelectedProduct(null)}
        onConfirm={handleConfirmPurchase}
      />

      {/* Success Modal */}
      {successData && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.success + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
            </View>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: Colors.black, marginBottom: 8 }}>
              Pembelian Berhasil
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: Colors.gray500, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              Token PLN untuk {successData.meterNo} berhasil dibeli.
            </Text>
            
            <View style={{ backgroundColor: Colors.gray50, width: '100%', padding: Spacing.md, borderRadius: Radius.lg, marginBottom: 24 }}>
              <Text style={{ fontSize: FontSize.xs, color: Colors.gray500, textAlign: 'center', marginBottom: 8, fontWeight: '600' }}>
                KODE TOKEN ANDA:
              </Text>
              <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary, textAlign: 'center', letterSpacing: 2 }}>
                {successData.sn || 'SEDANG DIPROSES'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: Colors.gray100, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' }} 
                onPress={() => {
                  setSuccessData(null);
                  setMeterNo('');
                  router.push('/(tabs)/transaksi');
                }}
              >
                <Text style={{ color: Colors.gray600, fontSize: FontSize.md, fontWeight: '700' }}>Tutup</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }} 
                onPress={handlePrintReceipt}
              >
                <Ionicons name="print" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: FontSize.md, fontWeight: '700' }}>Cetak Struk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: STATUS_BAR_HEIGHT + 8, paddingBottom: 16, paddingHorizontal: Spacing.md,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  stickyTop: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  meterCard: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.lg,
    padding: Spacing.md, marginVertical: Spacing.sm,
    backgroundColor: Colors.gray50,
  },
  meterLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  meterLabel: {
    color: Colors.warning, fontSize: 10, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  meterInput: {
    color: Colors.black, fontSize: FontSize.xl, fontWeight: '700', padding: 0,
  },
  meterHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  meterHintText: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: '600' },

  listHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  listHeaderTitle: { color: Colors.black, fontSize: FontSize.md, fontWeight: '700' },
  listHeaderCount: { color: Colors.gray400, fontSize: FontSize.sm },

  listContent: { padding: Spacing.md },
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: 10,
  },
  productIcon: {
    width: 52, height: 52, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0,
  },
  productInfo: { flex: 1 },
  productName: {
    color: Colors.black, fontSize: FontSize.md, fontWeight: '700', marginBottom: 2,
  },
  productDesc: { color: Colors.gray500, fontSize: FontSize.xs },
  productPriceCol: { alignItems: 'flex-end', marginLeft: 8 },
  productPriceValue: {
    color: Colors.warning, fontSize: FontSize.lg, fontWeight: '800',
  },

  loadingState: { alignItems: 'center', paddingTop: 60 },
  loadingText: { color: Colors.gray500, fontSize: FontSize.sm, marginTop: Spacing.sm },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { color: Colors.black, fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm },
  emptySubtitle: { color: Colors.gray500, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.warning + '18', borderRadius: Radius.full,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: Spacing.md,
  },
  retryBtnText: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: '700' },

  // Modal
  modalOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, width: '100%',
  },
  modalTitle: {
    color: Colors.black, fontSize: FontSize.xl, fontWeight: '800',
    textAlign: 'center', marginBottom: Spacing.lg,
  },
  modalDetailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  modalLabel: { color: Colors.gray500, fontSize: 13, fontWeight: '600' },
  modalValue: { color: Colors.black, fontSize: 13, fontWeight: '700', textAlign: 'right', flex: 1 },
  modalPrice: { color: Colors.warning, fontSize: 18 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: Spacing.md },
  modalBtnCancel: { flex: 1, backgroundColor: Colors.gray100, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  modalBtnCancelText: { color: Colors.gray600, fontSize: FontSize.md, fontWeight: '700' },
  modalBtnConfirm: { flex: 1, backgroundColor: Colors.warning, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  modalBtnConfirmText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  // Loading overlay
  loadingOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.xl, alignItems: 'center', gap: 12, minWidth: 160,
  },
  loadingCardText: { color: Colors.black, fontSize: FontSize.sm, fontWeight: '700' },
});
