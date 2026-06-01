import { Platform } from 'react-native';

// Safely import the printer module so it doesn't crash Expo Go if the native module is missing
let BLEPrinter: any = null;

try {
  if (Platform.OS !== 'web') {
    const ThermalPrinter = require('react-native-thermal-receipt-printer-image-qr');
    BLEPrinter = ThermalPrinter.BLEPrinter;
  }
} catch (error) {
  console.warn('Bluetooth printer module not found or failed to load. This is expected in Expo Go:', error);
}

// Wrapper for BluetoothManager to match previous expectations in app code
export const BluetoothManager = {
  isBluetoothEnabled: async () => {
    if (!BLEPrinter) return false;
    try {
      await BLEPrinter.init();
      return true;
    } catch (e) {
      console.warn('isBluetoothEnabled error:', e);
      return false;
    }
  },
  enableBluetooth: async () => {
    if (!BLEPrinter) return [];
    try {
      await BLEPrinter.init();
      const devices = await BLEPrinter.getDeviceList();
      return devices.map((d: any) => ({
        name: d.device_name || 'Unknown Printer',
        address: d.inner_mac_address,
      }));
    } catch (e) {
      console.warn('enableBluetooth error:', e);
      return [];
    }
  },
  scanDevices: async () => {
    if (!BLEPrinter) return;
    try {
      await BLEPrinter.init();
    } catch (e) {
      console.warn('scanDevices error:', e);
    }
  },
  connect: async (address: string) => {
    if (!BLEPrinter) throw new Error('Printer module not loaded');
    return await BLEPrinter.connectPrinter(address);
  }
};

// Wrapper for BluetoothEscposPrinter to match command-style prints
export const BluetoothEscposPrinter = {
  ALIGN: {
    LEFT: 0,
    CENTER: 1,
    RIGHT: 2
  },
  
  _currentAlign: 0,
  
  printerInit: async () => {
    BluetoothEscposPrinter._currentAlign = 0;
  },
  
  printerLeftSpace: async (space: number) => {
    // No-op
  },
  
  printerAlign: async (align: number) => {
    BluetoothEscposPrinter._currentAlign = align;
  },
  
  printText: async (text: string, opts: any = {}) => {
    if (!BLEPrinter) return;
    
    // If it's just newlines
    if (text === '\n\r' || text === '\r\n' || text === '\n') {
      await BLEPrinter.printRaw('\n');
      return;
    }
    
    // Clean up text
    let cleanText = text.replace(/[\n\r]/g, '');
    if (!cleanText) return;
    
    // Check if bold (opts.fonttype === 1 or bold flag)
    const isBold = opts.fonttype === 1 || opts.widthtimes === 1;
    
    let formattedText = cleanText;
    
    // Apply alignment tags
    if (BluetoothEscposPrinter._currentAlign === 1) {
      formattedText = isBold ? `<CB>${formattedText}</CB>` : `<C>${formattedText}</C>`;
    } else if (BluetoothEscposPrinter._currentAlign === 2) {
      formattedText = `<R>${formattedText}</R>`;
    } else {
      formattedText = isBold ? `<B>${formattedText}</B>` : `<L>${formattedText}</L>`;
    }
    
    await BLEPrinter.printBill(formattedText + '\n', { cut: false, beep: false });
  }
};

// Placeholder for BluetoothTscPrinter in case it's used elsewhere
export const BluetoothTscPrinter = null;

/**
 * Helper to format receipt strings.
 * Standard 58mm thermal printers usually fit 32 characters per line.
 */
export const PRINTER_WIDTH = 32;

/**
 * Creates a line that aligns a label to the left and value to the right.
 * E.g., "IDPEL          : 1234567890"
 */
export function formatLineKeyValue(label: string, value: string, separator: string = ' : '): string {
  const maxLabelLen = 10; // Matches receipt image alignment
  const paddedLabel = label.length > maxLabelLen ? label : label.padEnd(maxLabelLen, ' ');
  const combined = `${paddedLabel}${separator}${value}`;
  return combined;
}

/**
 * Centers a string.
 */
export function formatCenter(text: string): string {
  if (text.length >= PRINTER_WIDTH) return text.substring(0, PRINTER_WIDTH);
  const padLeft = Math.floor((PRINTER_WIDTH - text.length) / 2);
  return text.padStart(padLeft + text.length, ' ').padEnd(PRINTER_WIDTH, ' ');
}

export function formatLineDivider(): string {
  return '-'.repeat(PRINTER_WIDTH);
}

export async function printReceiptPln(
  printer: any, 
  data: {
    idpel: string,
    nama: string,
    trfDaya: string,
    nominal: string,
    rpToken: string,
    jmlKwh: string,
    admin: string,
    total: string,
    token: string
  }
) {
  if (!BLEPrinter) return;
  try {
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    // Format token
    const tkn = data.token.replace(/-/g, '');
    let tokenLines = data.token;
    if (tkn.length === 20) {
      const line1 = `${tkn.substring(0,4)}-${tkn.substring(4,8)}-${tkn.substring(8,12)}`;
      const line2 = `${tkn.substring(12,16)}-${tkn.substring(16,20)}`;
      tokenLines = `${line1}\n${line2}`;
    }

    const receiptText = `<CB>** BENGKEL GADGET **</CB>
<C>${dateStr} (CU)</C>

<C>STRUK PEMBELIAN LISTRIK</C>
<C>PRABAYAR</C>

${formatLineKeyValue('IDPEL', data.idpel)}
${formatLineKeyValue('NAMA', data.nama)}
${formatLineKeyValue('TRF/DAYA', data.trfDaya)}
${formatLineKeyValue('NOMINAL', data.nominal)}
${formatLineKeyValue('PPN', 'RP. 0,00')}
${formatLineKeyValue('ANGS/MAT', 'RP. 0,00/0,00')}
${formatLineKeyValue('RP TOKEN', data.rpToken)}
${formatLineKeyValue('JML KWH', data.jmlKwh)}
${formatLineKeyValue('BIAYA ADM', data.admin)}
${formatLineKeyValue('TOTAL BAYAR', data.total)}

<C>-- TOKEN --</C>
<CB>${tokenLines}</CB>

<C>Info Hubungi Call Center 123</C>
<C>Atau Hubungi PLN Terdekat</C>
\n\n\n`;

    await BLEPrinter.printBill(receiptText, { encoding: 'GBK', cut: false, beep: false });
  } catch (e) {
    console.error('Print receipt error', e);
    throw e;
  }
}
