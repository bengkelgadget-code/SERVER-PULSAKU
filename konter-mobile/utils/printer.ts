import { Platform } from 'react-native';

// Safely import the printer module so it doesn't crash Expo Go if the native module is missing
let BluetoothManager: any = null;
let BluetoothTscPrinter: any = null;
let BluetoothEscposPrinter: any = null;

try {
  if (Platform.OS !== 'web') {
    const ThermalPrinter = require('react-native-thermal-receipt-printer-image-qr');
    BluetoothManager = ThermalPrinter.BluetoothManager;
    BluetoothTscPrinter = ThermalPrinter.BluetoothTscPrinter;
    BluetoothEscposPrinter = ThermalPrinter.BluetoothEscposPrinter;
  }
} catch (error) {
  console.warn('Bluetooth printer module not found. This is expected in Expo Go.');
}

export { BluetoothManager, BluetoothTscPrinter, BluetoothEscposPrinter };

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
  // Don't truncate — the printer will auto-wrap. Truncating can cut off prices.
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
  if (!printer) return;
  try {
    await printer.printerInit();
    await printer.printerLeftSpace(0);
    
    // Header
    await printer.printerAlign(printer.ALIGN.CENTER);
    await printer.printText("** BENGKEL GADGET **\n\r", { fonttype: 1 });
    
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    await printer.printText(`${dateStr} (CU)\n\r\n\r`, {});
    
    await printer.printText("STRUK PEMBELIAN LISTRIK\n\rPRABAYAR\n\r\n\r", {});

    // Body
    await printer.printerAlign(printer.ALIGN.LEFT);
    await printer.printText(formatLineKeyValue('IDPEL', data.idpel) + '\n\r', {});
    await printer.printText(formatLineKeyValue('NAMA', data.nama) + '\n\r', {});
    await printer.printText(formatLineKeyValue('TRF/DAYA', data.trfDaya) + '\n\r', {});
    await printer.printText(formatLineKeyValue('NOMINAL', data.nominal) + '\n\r', {});
    await printer.printText(formatLineKeyValue('PPN', 'RP. 0,00') + '\n\r', {});
    await printer.printText(formatLineKeyValue('ANGS/MAT', 'RP. 0,00/0,00') + '\n\r', {});
    await printer.printText(formatLineKeyValue('RP TOKEN', data.rpToken) + '\n\r', {});
    await printer.printText(formatLineKeyValue('JML KWH', data.jmlKwh) + '\n\r', {});
    await printer.printText(formatLineKeyValue('BIAYA ADM', data.admin) + '\n\r', {});
    await printer.printText(formatLineKeyValue('TOTAL BAYAR', data.total) + '\n\r', {});
    
    // Token
    await printer.printText("\n\r", {});
    await printer.printerAlign(printer.ALIGN.CENTER);
    await printer.printText("-- TOKEN --\n\r\n\r", {});
    
    // Split token to format XXXX-XXXX-XXXX-XXXX into two lines
    const tkn = data.token.replace(/-/g, '');
    if (tkn.length === 20) {
      const line1 = `${tkn.substring(0,4)}-${tkn.substring(4,8)}-${tkn.substring(8,12)}`;
      const line2 = `${tkn.substring(12,16)}-${tkn.substring(16,20)}`;
      await printer.printText(`${line1}\n\r${line2}\n\r\n\r`, { widthtimes: 1, heigthtimes: 1 });
    } else {
      await printer.printText(`${data.token}\n\r\n\r`, { widthtimes: 1, heigthtimes: 1 });
    }

    // Footer
    await printer.printText("Info Hubungi Call Center 123\n\r", {});
    await printer.printText("Atau Hubungi PLN Terdekat\n\r", {});
    
    await printer.printText("\n\r\n\r\n\r", {});
  } catch (e) {
    console.error('Print receipt error', e);
    throw e;
  }
}
