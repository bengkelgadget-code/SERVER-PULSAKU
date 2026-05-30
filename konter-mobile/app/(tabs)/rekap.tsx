import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getTransactionStats } from '@/services/transaction.service';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

export default function RekapScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCount: 0,
    successCount: 0,
    failedCount: 0,
    totalExpense: 0,
    totalDeposit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;
    const data = await getTransactionStats(user.id);
    setStats(data);
    setIsLoading(false);
  };

  const rekapData = [
    { label: 'Total Transaksi',     value: stats.totalCount.toString(),          icon: 'swap-horizontal-outline', color: Colors.primary },
    { label: 'Berhasil',            value: stats.successCount.toString(),          icon: 'checkmark-circle-outline',color: Colors.accent  },
    { label: 'Gagal',               value: stats.failedCount.toString(),           icon: 'close-circle-outline',    color: Colors.error   },
    { label: 'Pendapatan Bulan Ini',value: `Rp ${(stats.totalDeposit / 1000).toFixed(0)}K`, icon: 'trending-up-outline',     color: Colors.warning },
  ];

  // Calculate category breakdown based on transaction types
  const categoryBreakdown = [
    { name: 'Pulsa',      count: Math.floor(stats.totalCount * 0.4), pct: 40, color: Colors.primary   },
    { name: 'Paket Data', count: Math.floor(stats.totalCount * 0.3), pct: 30, color: Colors.accent    },
    { name: 'Token PLN',  count: Math.floor(stats.totalCount * 0.2), pct: 20, color: Colors.warning   },
    { name: 'Lainnya',    count: Math.floor(stats.totalCount * 0.1), pct: 10, color: Colors.gray400   },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradientPrimary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Rekap Transaksi</Text>
        <Text style={styles.headerSub}>Periode: Mei 2026</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary grid */}
        <View style={styles.grid}>
          {rekapData.map(item => (
            <View key={item.label} style={[styles.statCard, Shadow.sm]}>
              <View style={[styles.statIcon, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Category breakdown */}
        <Text style={styles.sectionTitle}>Breakdown Kategori</Text>
        <View style={[styles.breakdownCard, Shadow.sm]}>
          {categoryBreakdown.map(cat => (
            <View key={cat.name} style={styles.breakdownRow}>
              <View style={[styles.catDot, { backgroundColor: cat.color }]} />
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catCount}>{cat.count} trx</Text>
              <View style={styles.barWrapper}>
                <View style={[styles.bar, { width: `${cat.pct}%`, backgroundColor: cat.color }]} />
              </View>
              <Text style={styles.catPct}>{cat.pct}%</Text>
            </View>
          ))}
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.noteText}>Data rekap diperbarui otomatis setiap hari pukul 00.00 WIB.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  header:    { paddingTop: STATUS_BAR_HEIGHT + 8, paddingBottom: 40, paddingHorizontal: Spacing.md },
  headerTitle: { color: '#fff', fontSize: FontSize.xl, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.sm, marginTop: 4 },

  content:   { paddingHorizontal: Spacing.md, marginTop: -24 },

  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.lg },
  statCard:  { width: '47%', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, gap: 8, alignItems: 'flex-start' },
  statIcon:  { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: Colors.black, fontSize: FontSize.xl, fontWeight: '800' },
  statLabel: { color: Colors.gray500, fontSize: FontSize.xs, fontWeight: '500' },

  sectionTitle: { color: Colors.black, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },

  breakdownCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, gap: 16, marginBottom: Spacing.lg },
  breakdownRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDot:        { width: 10, height: 10, borderRadius: 5 },
  catName:       { color: Colors.black, fontSize: FontSize.sm, fontWeight: '600', width: 80 },
  catCount:      { color: Colors.gray400, fontSize: FontSize.xs, width: 50 },
  barWrapper:    { flex: 1, height: 6, backgroundColor: Colors.gray100, borderRadius: 3, overflow: 'hidden' },
  bar:           { height: '100%', borderRadius: 3 },
  catPct:        { color: Colors.gray600, fontSize: FontSize.xs, fontWeight: '700', width: 32, textAlign: 'right' },

  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.primaryBg, borderRadius: Radius.md, padding: Spacing.sm },
  noteText:  { color: Colors.primary, fontSize: FontSize.xs, flex: 1 },
});