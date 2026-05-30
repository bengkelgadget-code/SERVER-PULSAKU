import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { PROVIDERS, CATEGORIES } from '@/services/product.service';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);
const HEADER_HEIGHT = 140 + STATUS_BAR_HEIGHT;
const CARD_TOP_OFFSET = HEADER_HEIGHT - 40;

// ─── Banner data ──────────────────────────────────────────────────────────────
const banners = [
  { id: '1', title: 'Transaksi Lebih Hemat!', sub: 'Cashback hingga 5% untuk semua operator', gradient: ['#6366F1', '#8B5CF6'] as const },
  { id: '2', title: 'Promo Paket Data',        sub: 'Data ekstra s.d. 30 GB, harga mulai 15K', gradient: ['#10B981', '#06B6D4'] as const },
  { id: '3', title: 'Token PLN Instan',         sub: 'Bayar token listrik, terima dalam 5 detik', gradient: ['#F59E0B', '#EF4444'] as const },
];

// ─── Quick actions ─────────────────────────────────────────────────────────────
const quickActions = [
  { id: 'topup',    label: 'Top Up',      icon: 'add-circle-outline'      as const, color: Colors.primary  },
  { id: 'transfer', label: 'Transfer',    icon: 'arrow-up-circle-outline' as const, color: Colors.accent   },
  { id: 'tarik',    label: 'Tarik',       icon: 'arrow-down-circle-outline' as const, color: Colors.warning },
  { id: 'tagihan',  label: 'Cek Tagihan', icon: 'document-text-outline'   as const, color: '#8B5CF6'       },
];

// ─── Balance Card ─────────────────────────────────────────────────────────────
function BalanceCard({ saldo, isLoading }: { saldo: number; isLoading: boolean }) {
  const [hidden, setHidden] = React.useState(false);
  return (
    <View style={[styles.balanceCard, Shadow.md]}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.balanceCardInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Saldo Akun</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.balanceAmount}>
                {hidden ? 'Rp ••••••••' : `Rp ${saldo.toLocaleString('id-ID')}`}
              </Text>
            )}
          </View>
          {!isLoading && (
            <TouchableOpacity onPress={() => setHidden(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray500} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.quickActionsRow}>
          {quickActions.map(action => (
            <TouchableOpacity 
              key={action.id} 
              style={styles.quickAction}
              onPress={() => {
                const router = require('expo-router').router;
                if (action.id === 'topup') router.push('/deposit');
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '1A' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Banner Carousel ──────────────────────────────────────────────────────────
function BannerCarousel() {
  const BANNER_WIDTH = width - 48;
  return (
    <FlatList
      data={banners}
      keyExtractor={item => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={BANNER_WIDTH + 12}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingRight: Spacing.md }}
      renderItem={({ item }) => (
        <LinearGradient
          colors={item.gradient}
          style={[styles.bannerItem, { width: BANNER_WIDTH, marginRight: 12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.bannerCircle} />
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <Text style={styles.bannerSub}>{item.sub}</Text>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>Lihat Promo →</Text>
          </View>
        </LinearGradient>
      )}
    />
  );
}

// ─── Provider Picker Modal ────────────────────────────────────────────────────
function ProviderModal({ visible, onClose, onSelect }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (providerId: string) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Pilih Operator</Text>
        <Text style={styles.modalSubtitle}>Pilih operator paket data yang ingin dibeli</Text>
        <View style={styles.providerGrid}>
          {PROVIDERS.map(provider => (
            <TouchableOpacity
              key={provider.id}
              style={styles.providerItem}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                onSelect(provider.id);
              }}
            >
              <View style={[styles.providerIconBox, { borderColor: provider.color + '40', borderWidth: 1.5 }]}>
                <Text style={{ fontSize: 28 }}>{provider.icon}</Text>
              </View>
              <Text style={styles.providerLabel}>{provider.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
          <Text style={styles.modalCancelText}>Batal</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Category Grid ────────────────────────────────────────────────────────────
function CategoryGrid() {
  const router = useRouter();
  const [showProviderModal, setShowProviderModal] = useState(false);

  const handleCategoryPress = (catName: string) => {
    if (catName === 'Pulsa') router.push('/pulsa/products');
    else if (catName === 'Token PLN') router.push('/token-pln');
    else if (catName === 'Paket Data') setShowProviderModal(true);
  };

  return (
    <>
      <ProviderModal
        visible={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        onSelect={(providerId) =>
          router.push({ pathname: '/paket-data/[providerId]', params: { providerId } })
        }
      />
      <View style={styles.categoryGrid}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryItem}
            activeOpacity={0.7}
            onPress={() => handleCategoryPress(cat.name)}
          >
            <View style={[styles.categoryIconBox, { backgroundColor: cat.bg }]}>
              <Ionicons name={cat.icon as any} size={26} color={cat.color} />
            </View>
            <Text style={styles.categoryLabel} numberOfLines={1}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const [saldo, setSaldo] = useState(0);
  const [saldoLoading, setSaldoLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaldo = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('users')
        .select('saldo')
        .eq('id', user.id)
        .single();
      if (data) setSaldo(Number(data.saldo) || 0);
    } catch (e) {
      console.error('Error fetching saldo:', e);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setSaldoLoading(true);
      fetchSaldo().finally(() => setSaldoLoading(false));
    }, [fetchSaldo])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSaldo();
    setRefreshing(false);
  }, [fetchSaldo]);

  const avatarInitials = user?.email?.[0]?.toUpperCase() || 'U';
  const displayName = user?.nama_toko || user?.email?.split('@')[0] || 'User';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradientPrimary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.menuBtn}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ marginLeft: Spacing.sm }}>
              <Text style={styles.headerGreeting}>Selamat Datang 👋</Text>
              <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
            <View style={[styles.headerIconBtn, styles.avatarBtn]}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: CARD_TOP_OFFSET }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            progressViewOffset={CARD_TOP_OFFSET - 20}
          />
        }
      >
        <BalanceCard saldo={saldo} isLoading={saldoLoading} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Promo Spesial</Text>
          <TouchableOpacity><Text style={styles.seeAll}>Lihat semua</Text></TouchableOpacity>
        </View>
        <BannerCarousel />

        <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
          <Text style={styles.sectionTitle}>Layanan</Text>
        </View>
        <CategoryGrid />

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    paddingTop: STATUS_BAR_HEIGHT + 4,
    paddingHorizontal: Spacing.md,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRight:  { flexDirection: 'row', alignItems: 'center' },
  menuBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerGreeting:{ color: 'rgba(255,255,255,0.85)', fontSize: FontSize.xs, fontWeight: '500' },
  headerName:   { color: '#fff', fontSize: FontSize.lg, fontWeight: '700', maxWidth: 180 },
  headerIconBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', position: 'relative', marginLeft: 8 },
  notifBadge:   { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.warning, position: 'absolute', top: 2, right: 2 },
  avatarBtn:    { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: Radius.full },
  avatarText:   { color: '#fff', fontWeight: '800', fontSize: FontSize.sm },

  scrollView: { flex: 1, zIndex: 1 },

  balanceCard: {
    marginHorizontal: Spacing.md,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  balanceCardInner: { padding: Spacing.lg },
  balanceRow:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.md },
  balanceLabel: { color: Colors.gray500, fontSize: FontSize.sm, fontWeight: '500', marginBottom: 4 },
  balanceAmount:{ color: Colors.black, fontSize: FontSize.xxl, fontWeight: '800', letterSpacing: -0.5 },
  eyeBtn:       { padding: 6 },
  divider:      { height: 1, backgroundColor: Colors.gray100, marginBottom: Spacing.md },

  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction:     { flex: 1, alignItems: 'center' },
  quickActionIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickActionLabel:{ color: Colors.gray600, fontSize: FontSize.xs, fontWeight: '600', textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  sectionTitle:  { color: Colors.black, fontSize: FontSize.lg, fontWeight: '700' },
  seeAll:        { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },

  bannerItem:    { height: 140, borderRadius: Radius.lg, padding: Spacing.md, justifyContent: 'flex-end', overflow: 'hidden' },
  bannerCircle:  { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.07)', top: -40, right: -30 },
  bannerTitle:   { color: '#fff', fontSize: FontSize.xl, fontWeight: '800', marginBottom: 4 },
  bannerSub:     { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm, marginBottom: Spacing.sm },
  bannerBadge:   { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full },
  bannerBadgeText:{ color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },

  categoryGrid:   { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.sm },
  categoryItem:   { width: '25%', alignItems: 'center', paddingVertical: Spacing.sm },
  categoryIconBox:{ width: 56, height: 56, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 6, overflow: 'hidden' },
  categoryLabel:  { color: Colors.gray700, fontSize: 11, fontWeight: '600', textAlign: 'center' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.md,
    paddingBottom: 40,
    paddingTop: 12,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray200, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: Colors.black, fontSize: FontSize.xl, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { color: Colors.gray500, fontSize: FontSize.sm, textAlign: 'center', marginBottom: Spacing.lg },

  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  providerItem: { width: '30%', alignItems: 'center', paddingVertical: Spacing.sm, marginHorizontal: '1.5%' },
  providerIconBox: { width: 64, height: 64, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden', backgroundColor: '#f8f8f8' },
  providerLabel: { color: Colors.black, fontSize: FontSize.xs, fontWeight: '700', textAlign: 'center' },

  modalCancelBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.gray100,
    borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center',
  },
  modalCancelText: { color: Colors.gray600, fontSize: FontSize.md, fontWeight: '700' },
});
