import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { PROVIDERS } from '@/services/product.service';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

// Menu items for data services
const DATA_MENUS = [
  {
    id: 'isi-ulang',
    label: 'Isi Ulang Data',
    desc: 'Beli paket data internet',
    icon: 'wifi' as const,
    color: Colors.primary,
  },
  {
    id: 'voucher-data',
    label: 'Voucher Data',
    desc: 'Tukar voucher paket data',
    icon: 'ticket-outline' as const,
    color: Colors.accent,
  },
  {
    id: 'cetak-voucher',
    label: 'Cetak Voucher',
    desc: 'Cetak voucher fisik',
    icon: 'print-outline' as const,
    color: Colors.warning,
  },
  {
    id: 'cetak-perdana',
    label: 'Cetak Perdana',
    desc: 'Cetak kartu perdana baru',
    icon: 'card-outline' as const,
    color: '#8B5CF6',
  },
  {
    id: 'cek-voucher',
    label: 'Cek / Redeem Voucher',
    desc: 'Cek status atau redeem voucher',
    icon: 'search-circle-outline' as const,
    color: '#EC4899',
  },
];

export default function PaketDataProviderScreen() {
  const router = useRouter();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();

  const provider = PROVIDERS.find(p => p.id === providerId) ?? PROVIDERS[0];

  const handleMenuPress = (menuId: string) => {
    if (menuId === 'isi-ulang') {
      router.push({
        pathname: '/paket-data/packages',
        params: { providerId: provider.id, providerName: provider.name },
      });
    } else {
      alert(`Fitur "${DATA_MENUS.find(m => m.id === menuId)?.label}" akan segera hadir!`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradientPrimary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.headerProviderIcon, { backgroundColor: provider.color + '30' }]}>
            <Text style={{ fontSize: 20 }}>{provider.icon}</Text>
          </View>
          <Text style={styles.headerTitle}>{provider.name}</Text>
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/')}>
          <Ionicons name="home-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Provider info card */}
        <View style={[styles.providerCard, Shadow.sm]}>
          <View style={[styles.providerIconLarge, { backgroundColor: provider.color + '18' }]}>
            <Text style={{ fontSize: 40 }}>{provider.icon}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <Text style={styles.providerDesc}>Layanan digital resmi {provider.name}</Text>
            <View style={[styles.activeBadge, { backgroundColor: Colors.accentBg }]}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Tersedia</Text>
            </View>
          </View>
        </View>

        {/* Menu list */}
        <Text style={styles.sectionTitle}>Pilih Layanan</Text>
        <View style={[styles.menuCard, Shadow.sm]}>
          {DATA_MENUS.map((menu, index) => (
            <React.Fragment key={menu.id}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleMenuPress(menu.id)}
              >
                <View style={[styles.menuIcon, { backgroundColor: menu.color + '18' }]}>
                  <Ionicons name={menu.icon} size={22} color={menu.color} />
                </View>

                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{menu.label}</Text>
                  <Text style={styles.menuDesc}>{menu.desc}</Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.gray300}
                />
              </TouchableOpacity>

              {index < DATA_MENUS.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: STATUS_BAR_HEIGHT + 8, paddingBottom: 16, paddingHorizontal: Spacing.md,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  homeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  headerProviderIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },

  content: { padding: Spacing.md },

  providerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  providerIconLarge: { width: 72, height: 72, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  providerName: { color: Colors.black, fontSize: FontSize.xl, fontWeight: '800', marginBottom: 4 },
  providerDesc: { color: Colors.gray500, fontSize: FontSize.xs, marginBottom: 8 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent, marginRight: 5 },
  activeText: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: '700' },

  sectionTitle: { color: Colors.black, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.sm },

  menuCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  menuIcon: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, flexShrink: 0 },
  menuText: { flex: 1 },
  menuLabel: { color: Colors.black, fontSize: FontSize.md, fontWeight: '600', marginBottom: 2 },
  menuDesc: { color: Colors.gray500, fontSize: FontSize.xs },
  separator: { height: 1, backgroundColor: Colors.gray100, marginHorizontal: Spacing.md },
});