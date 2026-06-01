import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/services/auth.service';
import { supabase, User } from '@/lib/supabase';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

const menuItems = [
  {
    section: 'Akun',
    items: [
      { icon: 'person-outline',        label: 'Profil Saya',      color: Colors.primary },
      { icon: 'lock-closed-outline',   label: 'Keamanan',         color: Colors.warning },
      { icon: 'notifications-outline', label: 'Notifikasi',       color: Colors.accent  },
    ],
  },
  {
    section: 'Transaksi',
    items: [
      { icon: 'card-outline',          label: 'Metode Pembayaran',color: '#8B5CF6' },
      { icon: 'receipt-outline',       label: 'Riwayat Deposit',  color: Colors.primary },
    ],
  },
  {
    section: 'Lainnya',
    items: [
      { icon: 'help-circle-outline',   label: 'Pusat Bantuan',    color: Colors.accent  },
      { icon: 'document-text-outline',  label: 'Syarat & Ketentuan',color: Colors.gray500 },
    ],
  },
];

export default function AkunScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch fresh profile from Supabase on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      setProfileLoading(true);
      try {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
        setProfile(data);
      } catch (e) {
        console.error('Error fetching profile:', e);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const displayUser = profile || user;
  const displayName = displayUser?.nama_toko || displayUser?.email?.split('@')[0] || 'User';
  const avatarInitial = displayUser?.email?.[0]?.toUpperCase() || 'U';

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header profile */}
      <LinearGradient
        colors={Colors.gradientPrimary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileRow}>
          {/* Avatar */}
          <View style={styles.avatar}>
            {profileLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            {profileLoading ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
            ) : (
              <>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileEmail}>{displayUser?.email || ''}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.accent} />
                  <Text style={styles.verifiedText}>Terverifikasi</Text>
                </View>
              </>
            )}
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Balance pill */}
        <View style={styles.balancePill}>
          <Ionicons name="wallet-outline" size={16} color={Colors.primary} />
          <Text style={styles.balancePillLabel}>Saldo: </Text>
          <Text style={styles.balancePillValue}>
            {profileLoading ? 'Memuat...' : `Rp ${(Number(displayUser?.saldo) || 0).toLocaleString('id-ID')}`}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {menuItems.map(section => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={[styles.menuCard, Shadow.sm]}>
              {section.items.map((item, idx) => (
                <React.Fragment key={item.label}>
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                    <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <View style={{ flex: 1 }} />
                    <Ionicons name="chevron-forward" size={16} color={Colors.gray300} />
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && <View style={styles.separator} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Printer Setup Button */}
        <TouchableOpacity 
          style={[styles.printerBtn, Shadow.sm]} 
          onPress={() => router.push('/(modals)/printer')}
          activeOpacity={0.8}
        >
          <View style={styles.printerIconWrap}>
            <Ionicons name="print" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.printerTitle}>Printer Bluetooth</Text>
            <Text style={styles.printerSubtitle}>Atur printer untuk cetak struk</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Konter v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  header: { paddingTop: STATUS_BAR_HEIGHT + 8, paddingBottom: 32, paddingHorizontal: Spacing.md },
  profileRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  avatar:        { width: 64, height: 64, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText:    { color: '#fff', fontSize: FontSize.xl, fontWeight: '800' },
  profileInfo:   { flex: 1, gap: 4 },
  profileName:   { color: '#fff', fontSize: FontSize.lg, fontWeight: '800' },
  profileEmail:  { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.xs },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  verifiedText:  { color: Colors.accent, fontSize: 10, fontWeight: '700' },
  editBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full },

  balancePill:   { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, ...Shadow.sm },
  balancePillLabel:{ color: Colors.gray500, fontSize: FontSize.sm },
  balancePillValue:{ color: Colors.primary, fontSize: FontSize.sm, fontWeight: '800' },

  content:      { padding: Spacing.md },
  section:      { marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.gray500, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginLeft: 4 },

  menuCard:    { backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md },
  menuIcon:     { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel:    { color: Colors.black, fontSize: FontSize.md, fontWeight: '600' },
  separator:    { height: 1, backgroundColor: Colors.gray100, marginHorizontal: Spacing.md },

  printerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  printerIconWrap: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.warning, alignItems: 'center', justifyContent: 'center' },
  printerTitle: { color: Colors.black, fontSize: FontSize.md, fontWeight: '700', marginBottom: 2 },
  printerSubtitle: { color: Colors.gray500, fontSize: FontSize.xs },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.error + '15',
    borderRadius: Radius.lg,
    paddingVertical: 16,
    marginBottom: Spacing.lg,
  },
  logoutText: { color: Colors.error, fontSize: FontSize.md, fontWeight: '700' },

  version: { color: Colors.gray400, fontSize: FontSize.xs, textAlign: 'center', marginBottom: Spacing.sm },
});
