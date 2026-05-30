'use client';

import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
};

function TabIcon({ name, color, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

function ProtectedTabs() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Role-based tab configuration
  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />
        ),
      }}
    >
      {/* Staff & Admin: Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      {/* All users: Transaksi */}
      <Tabs.Screen
        name="transaksi"
        options={{
          title: 'Transaksi',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'receipt' : 'receipt-outline'} color={color} focused={focused} />
          ),
        }}
      />
      {/* Admin: Rekap */}
      <Tabs.Screen
        name="rekap"
        options={{
          href: isAdmin ? '/rekap' : null,
          title: 'Rekap',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} color={color} focused={focused} />
          ),
        }}
      />
      {/* Admin: Informasi */}
      <Tabs.Screen
        name="informasi"
        options={{
          href: isAdmin ? '/informasi' : null,
          title: 'Informasi',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'newspaper' : 'newspaper-outline'} color={color} focused={focused} />
          ),
        }}
      />
      {/* All users: Akun */}
      <Tabs.Screen
        name="akun"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <ProtectedTabs />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
  },
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrapper: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  iconWrapperActive: {
    backgroundColor: Colors.primaryBg,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
