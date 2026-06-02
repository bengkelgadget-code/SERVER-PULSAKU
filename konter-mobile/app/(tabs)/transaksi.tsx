import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, StatusBar, ActivityIndicator, RefreshControl, Modal, Alert
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getTransactions, getTransactionStats, TransactionFilter } from '@/services/transaction.service';
import { Transaction, supabase } from '@/lib/supabase';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

const STATUS_CONFIG = {
  success: { color: Colors.accent,   bg: Colors.accentBg,   icon: 'checkmark-circle' as const, label: 'Sukses'  },
  pending: { color: Colors.warning,  bg: '#FFFBEB',        icon: 'time-outline'      as const, label: 'Proses'  },
  failed:  { color: Colors.error,    bg: '#FEF2F2',        icon: 'close-circle'      as const, label: 'Gagal'   },
};

const TYPE_ICON: Record<string, string> = {
  'Pulsa':      'phone-portrait-outline',
  'Paket Data': 'wifi-outline',
  'Token PLN':  'flash-outline',
  'Deposit':    'arrow-down-circle-outline',
};

const FILTERS: TransactionFilter[] = ['Semua', 'Sukses', 'Proses', 'Gagal'];

function TransactionItem({ item, onPress }: { item: Transaction; onPress: () => void }) {
  const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const isCredit = (item.amount ?? 0) > 0;

  return (
    <TouchableOpacity style={[styles.txCard, Shadow.sm]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.txIcon, { backgroundColor: isCredit ? Colors.accentBg : Colors.primaryBg }]}>
        <Ionicons
          name={(TYPE_ICON[item.type] ?? 'swap-horizontal-outline') as any}
          size={22}
          color={isCredit ? Colors.accent : Colors.primary}
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txType}>{item.type}</Text>
        <Text style={styles.txDetail} numberOfLines={1}>{item.detail}</Text>
        <Text style={styles.txDate}>
          {new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
        </Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isCredit ? Colors.accent : Colors.black }]}>
          {isCredit ? '+' : '-'}Rp {Math.abs(item.amount ?? 0).toLocaleString('id-ID')}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={11} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TransaksiScreen() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('Semua');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ totalCount: 0, successCount: 0, failedCount: 0, totalExpense: 0, totalDeposit: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'sukses' | 'gagal' } | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
  const toastTimeoutRef = React.useRef<any>(null);

  const showToast = (message: string, type: 'sukses' | 'gagal') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // 1. Load data when filter or user changes
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, activeFilter]);

  // 2. Realtime listener for transaction updates and inserts
  useEffect(() => {
    if (!user?.id) return;

    console.log(`[Realtime] Subscribing to transactions for user: ${user.id}`);
    
    const channel = supabase
      .channel(`user-tx-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('[Realtime] Transaction event received:', payload.eventType, payload);
          
          // Re-fetch transactions & stats automatically
          await loadData();

          if (payload.eventType === 'UPDATE') {
            const newTx = payload.new as any;
            const oldTx = payload.old as any;

            if (newTx && oldTx && newTx.status !== oldTx.status) {
              if (newTx.status === 'sukses') {
                showToast(`Transaksi ${newTx.type || 'Produk'} Berhasil! Nomor: ${newTx.customer_no || ''}`, 'sukses');
              } else if (newTx.status === 'gagal') {
                showToast(`Transaksi ${newTx.type || 'Produk'} Gagal! Saldo Anda telah dikembalikan.`, 'gagal');
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime] Unsubscribing from transactions channel...');
      supabase.removeChannel(channel);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [txData, statsData] = await Promise.all([
        getTransactions(user.id, activeFilter),
        getTransactionStats(user.id),
      ]);
      setTransactions(txData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handlePrintShare = async (tx: Transaction) => {
    try {
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', 'Helvetica', sans-serif; padding: 20px; color: #333; }
              .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; margin: 0; }
              .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
              .row-bold { font-weight: bold; font-size: 16px; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px; }
              .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #888; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">BENGKEL GADGET</h1>
              <p class="subtitle">Struk Transaksi Digital</p>
            </div>
            
            <div class="row">
              <span>Waktu</span>
              <span>${new Date(tx.created_at).toLocaleString('id-ID')}</span>
            </div>
            <div class="row">
              <span>No. Transaksi</span>
              <span>${tx.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div class="row">
              <span>Status</span>
              <span style="font-weight: bold; color: ${tx.status === 'sukses' ? '#10B981' : tx.status === 'gagal' ? '#EF4444' : '#F59E0B'}">
                ${tx.status.toUpperCase()}
              </span>
            </div>
            
            <div style="margin: 20px 0; border-top: 1px solid #eee; padding-top: 15px;">
              <div class="row">
                <span>Produk</span>
                <span style="text-align: right; max-width: 60%;">${tx.type}</span>
              </div>
              <div class="row">
                <span>Tujuan</span>
                <span>${tx.customer_no || '-'}</span>
              </div>
              <div class="row">
                <span>SN / Ref</span>
                <span style="font-size: 12px;">${tx.sn || tx.ref_id || '-'}</span>
              </div>
            </div>

            <div class="row row-bold">
              <span>Total Harga</span>
              <span>Rp ${Math.abs(tx.amount ?? 0).toLocaleString('id-ID')}</span>
            </div>

            <div class="footer">
              <p>Terima kasih telah bertransaksi di Bengkel Gadget.</p>
              <p>Simpan struk ini sebagai bukti pembayaran yang sah.</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error generating receipt:', error);
      Alert.alert('Gagal', 'Tidak dapat membuat atau membagikan struk transaksi.');
    }
  };

  const filtered = transactions;

  return (
    <View style={styles.container}>
      {/* Floating Toast Notification */}
      {toast && (
        <View style={[
          styles.toastContainer,
          Shadow.md,
          toast.type === 'sukses' ? styles.toastSuccess : styles.toastFailed
        ]}>
          <Ionicons
            name={toast.type === 'sukses' ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={toast.type === 'sukses' ? Colors.accent : Colors.error}
          />
          <Text style={[
            styles.toastText,
            { color: toast.type === 'sukses' ? Colors.accent : Colors.error }
          ]}>
            {toast.message}
          </Text>
          <TouchableOpacity onPress={() => setToast(null)} style={styles.toastCloseBtn}>
            <Ionicons
              name="close"
              size={16}
              color={toast.type === 'sukses' ? Colors.accent : Colors.error}
              style={{ opacity: 0.6 }}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Receipt Modal */}
      <Modal
        visible={!!selectedTx}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Transaksi</Text>
              <TouchableOpacity onPress={() => setSelectedTx(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={Colors.gray500} />
              </TouchableOpacity>
            </View>
            
            {selectedTx && (
              <View style={styles.receiptBody}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[selectedTx.status as keyof typeof STATUS_CONFIG]?.bg || Colors.gray200 }]}>
                    <Text style={[styles.statusText, { color: STATUS_CONFIG[selectedTx.status as keyof typeof STATUS_CONFIG]?.color || Colors.black }]}>
                      {STATUS_CONFIG[selectedTx.status as keyof typeof STATUS_CONFIG]?.label || 'Pending'}
                    </Text>
                  </View>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Tanggal</Text>
                  <Text style={styles.receiptValue}>{new Date(selectedTx.created_at).toLocaleString('id-ID')}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Produk</Text>
                  <Text style={styles.receiptValue}>{selectedTx.type}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Nomor Tujuan</Text>
                  <Text style={styles.receiptValue}>{selectedTx.customer_no || '-'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>SN / Ref</Text>
                  <Text style={styles.receiptValue}>{selectedTx.sn || selectedTx.ref_id || '-'}</Text>
                </View>
                
                <View style={styles.receiptDivider} />
                
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabelBold}>Total Bayar</Text>
                  <Text style={styles.receiptAmount}>Rp {Math.abs(selectedTx.amount ?? 0).toLocaleString('id-ID')}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.printBtn} 
                  activeOpacity={0.8}
                  onPress={() => handlePrintShare(selectedTx)}
                >
                  <Ionicons name="share-outline" size={20} color="#fff" />
                  <Text style={styles.printBtnText}>Bagikan / Cetak PDF</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <LinearGradient
        colors={Colors.gradientPrimary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="search-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        {[
          { label: 'Total', value: stats.totalCount.toString(), icon: 'swap-horizontal-outline', color: Colors.primary },
          { label: 'Pengeluaran', value: `Rp ${(stats.totalExpense / 1000).toFixed(0)}K`, icon: 'trending-down-outline', color: Colors.error },
          { label: 'Deposit', value: `Rp ${(stats.totalDeposit / 1000).toFixed(0)}K`, icon: 'trending-up-outline', color: Colors.accent },
        ].map(card => (
          <View key={card.label} style={[styles.summaryCard, Shadow.sm]}>
            <View style={[styles.summaryIcon, { backgroundColor: card.color + '18' }]}>
              <Ionicons name={card.icon as any} size={18} color={card.color} />
            </View>
            <Text style={styles.summaryValue}>{card.value}</Text>
            <Text style={styles.summaryLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
        renderItem={({ item }) => <TransactionItem item={item} onPress={() => setSelectedTx(item)} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
              <Text style={styles.emptyText}>Transaksi Anda akan muncul di sini</Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.gray50 },
  
  toastContainer: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 60, // Place it right below the header
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
  },
  toastSuccess: {
    backgroundColor: '#ECFDF5', // emerald 50
    borderColor: '#A7F3D0',     // emerald 200
  },
  toastFailed: {
    backgroundColor: '#FEF2F2',  // red 50
    borderColor: '#FCA5A5',      // red 300
  },
  toastText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  toastCloseBtn: {
    padding: 2,
  },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: STATUS_BAR_HEIGHT + 8, paddingBottom: 16, paddingHorizontal: Spacing.md },
  headerTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  headerIconBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  summaryRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md, marginTop: -20, marginBottom: Spacing.md },
  summaryCard:   { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center', gap: 4 },
  summaryIcon:   { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  summaryValue:  { color: Colors.black, fontSize: FontSize.md, fontWeight: '800' },
  summaryLabel:  { color: Colors.gray400, fontSize: 9, fontWeight: '500', textAlign: 'center' },

  filterRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  filterChip:    { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.gray200 },
  filterChipActive:{ backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText:    { color: Colors.gray600, fontSize: FontSize.sm, fontWeight: '600' },
  filterTextActive:{ color: '#fff' },

  listContent: { paddingHorizontal: Spacing.md, gap: 10 },
  txCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, gap: 12 },
  txIcon:      { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txInfo:      { flex: 1, gap: 2 },
  txType:      { color: Colors.black, fontSize: FontSize.md, fontWeight: '700' },
  txDetail:    { color: Colors.gray500, fontSize: FontSize.xs },
  txDate:      { color: Colors.gray400, fontSize: FontSize.xs },
  txRight:     { alignItems: 'flex-end', gap: 4 },
  txAmount:    { fontSize: FontSize.md, fontWeight: '800' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full },
  statusText:  { fontSize: 10, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: Colors.black, fontSize: FontSize.md, fontWeight: '700', marginTop: Spacing.md },
  emptyText: { color: Colors.gray400, fontSize: FontSize.sm, marginTop: Spacing.xs },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.black },
  modalCloseBtn: { padding: 4 },
  
  receiptBody: { backgroundColor: Colors.gray50, padding: Spacing.md, borderRadius: Radius.lg, gap: 12 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  receiptLabel: { color: Colors.gray500, fontSize: FontSize.sm },
  receiptValue: { color: Colors.black, fontSize: FontSize.sm, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  receiptLabelBold: { color: Colors.black, fontSize: FontSize.md, fontWeight: '700' },
  receiptAmount: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: '800' },
  receiptDivider: { height: 1, backgroundColor: Colors.gray200, marginVertical: Spacing.xs },
  
  printBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.md, borderRadius: Radius.lg, marginTop: Spacing.md, gap: 8 },
  printBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
