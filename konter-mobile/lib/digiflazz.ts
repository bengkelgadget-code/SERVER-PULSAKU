/**
 * DigiFlazz API Client
 * Mobile app uses the same credentials as web app (centralized, admin/SAAS owner only)
 *
 * Auth: MD5 signature of username + apiKey + command
 * Base URL: https://api.digiflazz.com/v1
 */
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

const BASE_URL = 'https://api.digiflazz.com/v1';
const DIGIFLAZZ_USERNAME = process.env.EXPO_PUBLIC_DIGIFLAZZ_USERNAME || '';
const DIGIFLAZZ_API_KEY = process.env.EXPO_PUBLIC_DIGIFLAZZ_API_KEY || '';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DigiFlazzProduct {
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  desc: string;
}

export interface DigiFlazzTransactionResult {
  ref_id: string;
  customer_no: string;
  buyer_sku_code: string;
  message: string;
  status: 'Pending' | 'Sukses' | 'Gagal';
  rc: string;
  sn: string;
  buyer_last_saldo: number;
  price: number;
}

// ─── Auth: MD5 Signature ─────────────────────────────────────────────────────
async function generateSignature(command: string): Promise<string> {
  const input = DIGIFLAZZ_USERNAME + DIGIFLAZZ_API_KEY + command;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.MD5,
    input
  );
  return hash.toLowerCase();
}

// ─── Core fetch ───────────────────────────────────────────────────────────────
async function post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  if (!DIGIFLAZZ_USERNAME || !DIGIFLAZZ_API_KEY) {
    throw new Error('DigiFlazz credentials not configured');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`DigiFlazz API Error: ${response.statusText}`);
  }

  return response.json();
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Get price list from DigiFlazz.
 * Returns products grouped by category/brand for display.
 */
export async function getPriceList(
  command: 'prepaid' | 'postpaid' = 'prepaid'
): Promise<DigiFlazzProduct[]> {
  const signature = await generateSignature('depo');
  const response = await post<{ data: DigiFlazzProduct[] }>('/price-list', {
    cmd: command,
    username: DIGIFLAZZ_USERNAME,
    sign: signature,
  });

  return response.data ?? [];
}

/**
 * Get active products only (buyer and seller status both true).
 */
export async function getActiveProducts(): Promise<DigiFlazzProduct[]> {
  const products = await getPriceList('prepaid');
  return products.filter(
    p => p.buyer_product_status === true && p.seller_product_status === true
  );
}

/**
 * Create a transaction via DigiFlazz.
 * Returns result with status.
 *
 * NOTE: Mobile app should call the Supabase RPC endpoint instead of this directly,
 * to ensure atomic balance lock + transaction record.
 */
export async function createTransaction(
  skuCode: string,
  customerNo: string,
  refId: string
): Promise<DigiFlazzTransactionResult> {
  const signature = await generateSignature(refId);
  const response = await post<{ data: DigiFlazzTransactionResult }>('/transaction', {
    username: DIGIFLAZZ_USERNAME,
    buyer_sku_code: skuCode,
    customer_no: customerNo,
    ref_id: refId,
    sign: signature,
  });

  return response.data;
}
