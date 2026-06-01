import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Platform, StatusBar, ActivityIndicator, Alert, PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { BluetoothManager, BluetoothEscposPrinter } from '@/utils/printer';

export default function PrinterScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [pairedDevices, setPairedDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const isPrinterSupported = !!BluetoothManager;

  useEffect(() => {
    if (isPrinterSupported) {
      requestBluetoothPermission().then((granted) => {
        if (granted) {
          checkConnected();
          loadPairedDevices();
        }
      });
    }
  }, [isPrinterSupported]);

  const requestBluetoothPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 31) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]);
          return granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const checkConnected = async () => {
    try {
      const isEnabled = await BluetoothManager.isBluetoothEnabled();
      if (!isEnabled) {
        Alert.alert('Bluetooth Mati', 'Mohon nyalakan Bluetooth Anda terlebih dahulu.');
        return;
      }
      // Often the library remembers the last connected device, but we usually 
      // rely on the user to select one, or we attempt to auto-connect to the last one.
    } catch (e) {
      console.log('Error checking bluetooth:', e);
    }
  };

  const loadPairedDevices = async () => {
    try {
      const res = await BluetoothManager.enableBluetooth();
      const paired = res?.map((device: any) => {
        let parsed = typeof device === 'string' ? JSON.parse(device) : device;
        return parsed;
      }) || [];
      setPairedDevices(paired);
    } catch (e) {
      console.log('Error loading paired devices', e);
    }
  };

  const scanDevices = async () => {
    if (!isPrinterSupported) return;
    setIsScanning(true);
    try {
      await BluetoothManager.scanDevices();
      // Wait for devices to be found, typically requires listening to an event,
      // but for simplicity we rely on loadPairedDevices for standard Bluetooth pairing via OS settings.
      // ThermalPrinter library returns devices differently based on OS.
      const res = await BluetoothManager.enableBluetooth();
      const available = res?.map((device: any) => {
        return typeof device === 'string' ? JSON.parse(device) : device;
      }) || [];
      setPairedDevices(available);
    } catch (e) {
      console.error(e);
      Alert.alert('Gagal', 'Tidak dapat memindai perangkat Bluetooth.');
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: any) => {
    setIsConnecting(true);
    try {
      await BluetoothManager.connect(device.address);
      setConnectedDevice(device);
      Alert.alert('Sukses', `Terhubung ke printer ${device.name || device.address}`);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Gagal Terhubung', e.message || 'Tidak dapat terhubung ke printer. Pastikan printer menyala.');
    } finally {
      setIsConnecting(false);
    }
  };

  const testPrint = async () => {
    if (!connectedDevice) {
      Alert.alert('Printer belum terhubung', 'Silakan hubungkan printer terlebih dahulu.');
      return;
    }
    try {
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printerLeftSpace(0);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText("** BENGKEL GADGET **\n\r", {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1
      });
      await BluetoothEscposPrinter.printText("Test Print Berhasil\n\r", {});
      await BluetoothEscposPrinter.printText("--------------------------------\n\r", {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText("Aplikasi sudah terhubung ke\n\r", {});
      await BluetoothEscposPrinter.printText("printer Bluetooth dengan baik.\n\r", {});
      await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {});
    } catch (e) {
      Alert.alert('Gagal Cetak', 'Printer bermasalah atau terputus.');
    }
  };

  if (!isPrinterSupported) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Ionicons name="warning" size={48} color={Colors.warning} />
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
          Fitur tidak didukung di Expo Go
        </Text>
        <Text style={{ fontSize: 14, color: Colors.gray500, marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
          Modul Printer Native (Bluetooth ESC/POS) membutuhkan aplikasi yang dibuild ulang (APK/Dev Client).
          Jika Anda membuka ini lewat aplikasi Expo Go standar, fitur ini tidak dapat dijalankan.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} style={{ marginTop: 24, backgroundColor: Colors.gray200, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}>
          <Text style={{ fontWeight: '700' }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Printer Bluetooth</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Status Card */}
        <View style={[styles.statusCard, Shadow.sm]}>
          <View style={[styles.statusIconWrap, { backgroundColor: connectedDevice ? Colors.success + '20' : Colors.error + '20' }]}>
            <Ionicons name="print" size={32} color={connectedDevice ? Colors.success : Colors.error} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Status Printer</Text>
            {connectedDevice ? (
              <Text style={[styles.statusValue, { color: Colors.success }]}>
                Terhubung: {connectedDevice.name || connectedDevice.address}
              </Text>
            ) : (
              <Text style={[styles.statusValue, { color: Colors.error }]}>Belum Terhubung</Text>
            )}
          </View>
          {connectedDevice && (
            <TouchableOpacity style={styles.testBtn} onPress={testPrint}>
              <Text style={styles.testBtnText}>Test</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>Perangkat Tersedia</Text>
          <TouchableOpacity onPress={scanDevices} disabled={isScanning}>
            {isScanning ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.scanText}>Scan Ulang</Text>
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          data={pairedDevices}
          keyExtractor={(item, index) => item.address || String(index)}
          contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const isConnected = connectedDevice?.address === item.address;
            return (
              <TouchableOpacity
                style={[styles.deviceCard, isConnected && styles.deviceCardActive]}
                onPress={() => !isConnected && connectToDevice(item)}
                disabled={isConnecting || isConnected}
              >
                <View style={[styles.deviceIcon, isConnected && { backgroundColor: Colors.primary }]}>
                  <Ionicons name="bluetooth" size={20} color={isConnected ? '#fff' : Colors.gray500} />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={[styles.deviceName, isConnected && { color: Colors.primary }]}>
                    {item.name || 'Unknown Device'}
                  </Text>
                  <Text style={styles.deviceAddress}>{item.address}</Text>
                </View>
                {isConnecting && connectedDevice?.address === item.address ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : isConnected ? (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                ) : (
                  <Text style={styles.connectText}>Hubungkan</Text>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 32 }}>
              <Ionicons name="bluetooth-outline" size={48} color={Colors.gray300} />
              <Text style={{ color: Colors.gray500, marginTop: 12, textAlign: 'center' }}>
                Tidak ada perangkat Bluetooth. Pastikan Anda sudah pairing printer via pengaturan HP terlebih dahulu.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: STATUS_BAR_HEIGHT + 8, paddingBottom: 16, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { color: Colors.black, fontSize: FontSize.lg, fontWeight: '700' },
  
  content: { flex: 1, padding: Spacing.md },
  
  statusCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.xl,
  },
  statusIconWrap: { width: 56, height: 56, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  statusInfo: { flex: 1 },
  statusLabel: { color: Colors.gray500, fontSize: FontSize.xs, fontWeight: '600', marginBottom: 4 },
  statusValue: { fontSize: FontSize.md, fontWeight: '800' },
  testBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  testBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listHeaderTitle: { color: Colors.gray600, fontSize: FontSize.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  scanText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },

  deviceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.gray200,
  },
  deviceCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '05' },
  deviceIcon: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  deviceInfo: { flex: 1 },
  deviceName: { color: Colors.black, fontSize: FontSize.md, fontWeight: '700', marginBottom: 2 },
  deviceAddress: { color: Colors.gray500, fontSize: 10 },
  connectText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
});
