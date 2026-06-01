import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
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

function TransactionItem({ item }: { item: Transaction }) {
  const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const isCredit = (item.amount ?? 0) > 0;

  return (
    <View style={[styles.txCard, Shadow.sm]}>
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
    </View>
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
        renderItem={({ item }) => <TransactionItem item={item} />}
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
});
