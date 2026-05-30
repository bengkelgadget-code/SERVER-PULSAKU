import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

const announcements = [
  { id: '1', tag: 'Promo', title: 'Cashback 5% Pulsa Telkomsel', date: '10 Mei 2026', icon: 'megaphone-outline', color: Colors.primary },
  { id: '2', tag: 'Info',  title: 'Pemeliharaan sistem 12 Mei pukul 02.00-04.00', date: '9 Mei 2026', icon: 'construct-outline', color: Colors.warning },
  { id: '3', tag: 'Promo', title: 'Paket Data XL mulai 15.000!', date: '8 Mei 2026', icon: 'wifi-outline', color: Colors.accent },
  { id: '4', tag: 'Info',  title: 'Layanan baru: Pembayaran BPJS Kesehatan', date: '7 Mei 2026', icon: 'medical-outline', color: '#EC4899' },
];

export default function InformasiScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradientPrimary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Informasi</Text>
        <Text style={styles.headerSub}>Promo & Pengumuman terbaru</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 12 }}>
          {announcements.map(item => (
            <TouchableOpacity key={item.id} style={[styles.card, Shadow.sm]} activeOpacity={0.8}>
              <View style={[styles.cardIcon, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.tagBadge, { backgroundColor: item.color + '18' }]}>
                  <Text style={[styles.tagText, { color: item.color }]}>{item.tag}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header:    { paddingTop: STATUS_BAR_HEIGHT + 8, paddingBottom: 40, paddingHorizontal: Spacing.md },
  headerTitle: { color: '#fff', fontSize: FontSize.xl, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.sm, marginTop: 4 },

  content: { padding: Spacing.md, marginTop: -20 },

  card:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md },
  cardIcon: { width: 50, height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1, gap: 4 },
  tagBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  tagText:  { fontSize: 10, fontWeight: '800' },
  cardTitle:{ color: Colors.black, fontSize: FontSize.sm, fontWeight: '700', lineHeight: 20 },
  cardDate: { color: Colors.gray400, fontSize: FontSize.xs },
});
