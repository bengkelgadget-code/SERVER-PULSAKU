import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Platform, StatusBar, ActivityIndicator, Alert, Clipboard, ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export default function DepositScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [amountStr, setAmountStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for ticket
  const [ticket, setTicket] = useState<any>(null);

  const handleCreateTicket = async () => {
    const amount = parseInt(amountStr.replace(/\D/g, ''), 10);
    
    if (!amount || amount < 10000) {
      Alert.alert('Error', 'Minimal deposit adalah Rp 10.000');
      return;
    }
    
    if (!session?.access_token) {
      Alert.alert('Error', 'Sesi habis, silakan login ulang');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_APP_URL || 'https://server-pulsaku.vercel.app'}/api/mobile/deposit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ amount }),
        }
      );

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        Alert.alert('Gagal', data.error || 'Terjadi kesalahan saat membuat tiket deposit');
        return;
      }
      
      setTicket(data);
    } catch (error) {
      console.error('Topup error:', error);
      Alert.alert('Error', 'Tidak bisa terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };
  
  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Berhasil', `${label} berhasil disalin!`);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={Colors.gradientPrimary}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Top Up Saldo</Text>
          <View style={{ width: 36 }} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {!ticket ? (
            /* ================= INPUT NOMINAL ================= */
            <View style={styles.card}>
              <Text style={styles.label}>Nominal Top Up</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencyPrefix}>Rp</Text>
                <TextInput
                  style={styles.input}
                  value={amountStr}
                  onChangeText={(text) => {
                    const cleanText = text.replace(/\D/g, '');
                    setAmountStr(cleanText ? parseInt(cleanText, 10).toLocaleString('id-ID') : '');
                  }}
                  placeholder="0"
                  placeholderTextColor={Colors.gray400}
                  keyboardType="numeric"
                />
              </View>
              
              <Text style={styles.minText}>Minimal Top Up Rp 10.000</Text>
              
              <View style={styles.quickAmountGrid}>
                {QUICK_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.quickAmountBtn}
                    onPress={() => setAmountStr(amt.toLocaleString('id-ID'))}
                  >
                    <Text style={styles.quickAmountText}>{formatRupiah(amt)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity 
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleCreateTicket}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Lanjutkan Top Up</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* ================= TICKET INSTRUCTIONS ================= */
            <View style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Ionicons name="time-outline" size={32} color={Colors.warning} />
                <Text style={styles.ticketStatusText}>Menunggu Pembayaran</Text>
                <Text style={styles.ticketSubText}>Otomatis masuk setelah transfer</Text>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.instructionLabel}>Silakan transfer TEPAT sejumlah:</Text>
              
              <View style={styles.amountBox}>
                <Text style={styles.exactAmountText}>
                  {formatRupiah(ticket.deposit.total_amount)}
                </Text>
                <TouchableOpacity 
                  style={styles.copyBtn}
                  onPress={() => copyToClipboard(ticket.deposit.total_amount.toString(), 'Nominal transfer')}
                >
                  <Ionicons name="copy-outline" size={18} color={Colors.primary} />
                  <Text style={styles.copyBtnText}>Salin</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.warningBox}>
                <Ionicons name="alert-circle" size={20} color={Colors.error} />
                <Text style={styles.warningText}>
                  PENTING! Transfer harus tepat hingga 3 digit terakhir agar saldo otomatis masuk.
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.instructionLabel}>Tujuan Transfer:</Text>
              <View style={styles.bankBox}>
                <View style={styles.bankHeader}>
                  <Text style={styles.bankName}>{ticket.payment_instruction.bank}</Text>
                </View>
                
                <Text style={styles.accountNumber}>{ticket.payment_instruction.account_number}</Text>
                <Text style={styles.accountName}>a.n {ticket.payment_instruction.account_name}</Text>
                
                <TouchableOpacity 
                  style={styles.copyBtnFilled}
                  onPress={() => copyToClipboard(ticket.payment_instruction.account_number.replace(/\s/g, ''), 'Nomor rekening')}
                >
                  <Ionicons name="copy-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.copyBtnFilledText}>Salin No. Rekening</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.doneBtn}
                onPress={() => router.replace('/(tabs)/')}
              >
                <Text style={styles.doneBtnText}>Saya Sudah Transfer</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

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
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  
  scrollContent: { padding: Spacing.md },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  label: { fontSize: FontSize.md, fontWeight: '600', color: Colors.gray700, marginBottom: 12 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 8,
    marginBottom: 8,
  },
  currencyPrefix: { fontSize: 24, fontWeight: '700', color: Colors.black, marginRight: 8 },
  input: { flex: 1, fontSize: 32, fontWeight: '700', color: Colors.black, padding: 0 },
  minText: { fontSize: FontSize.xs, color: Colors.gray500, marginBottom: 24 },
  
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  quickAmountBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    backgroundColor: Colors.gray50,
  },
  quickAmountText: { color: Colors.gray700, fontWeight: '600', fontSize: FontSize.sm },
  
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: Colors.gray400 },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  
  // Ticket Styles
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  ticketHeader: { alignItems: 'center', marginVertical: 8 },
  ticketStatusText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.warning, marginTop: 8 },
  ticketSubText: { fontSize: FontSize.sm, color: Colors.gray500, marginTop: 4 },
  
  divider: { height: 1, backgroundColor: Colors.gray200, marginVertical: 20 },
  
  instructionLabel: { fontSize: FontSize.sm, color: Colors.gray600, marginBottom: 8 },
  
  amountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 12,
  },
  exactAmountText: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  copyBtn: { flexDirection: 'row', alignItems: 'center' },
  copyBtnText: { color: Colors.primary, fontWeight: '700', marginLeft: 4 },
  
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  warningText: { flex: 1, color: Colors.error, fontSize: FontSize.xs, fontWeight: '600', marginLeft: 8 },
  
  bankBox: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: 8,
  },
  bankHeader: { marginBottom: 12 },
  bankName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.black },
  accountNumber: { fontSize: 22, fontWeight: '700', color: Colors.gray800, letterSpacing: 1 },
  accountName: { fontSize: FontSize.md, color: Colors.gray600, marginTop: 4, marginBottom: 16 },
  
  copyBtnFilled: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  copyBtnFilledText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  
  doneBtn: {
    marginTop: 24,
    backgroundColor: Colors.gray800,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
