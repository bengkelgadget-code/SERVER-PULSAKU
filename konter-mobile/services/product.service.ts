import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────────
// Matches the unified `products` table from Supabase (synced from DigiFlazz)

export interface PulsaProduct {
  id?: string;
  sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  harga_modal: number;
  harga_jual: number;
  is_active: boolean;
}

export interface Provider {
  id: string;
  name: string;
  prefixes: string[];
  color: string;
  icon: string;
}

// ─── Provider Config ──────────────────────────────────────────────────────────
export const PROVIDERS: Provider[] = [
  { id: 'Telkomsel',  name: 'Telkomsel',  prefixes: ['0811','0812','0813','0821','0822','0823','0851','0852','0853'], color: '#EF4444', icon: '📶' },
  { id: 'Indosat',   name: 'Indosat',    prefixes: ['0814','0815','0816','0855','0856','0857','0858'], color: '#F59E0B', icon: '🌐' },
  { id: 'XL',        name: 'XL',         prefixes: ['0817','0818','0819','0859','0877','0878'], color: '#3B82F6', icon: '📱' },
  { id: 'Axis',      name: 'Axis',       prefixes: ['0831','0832','0833','0838'], color: '#8B5CF6', icon: '💜' },
  { id: 'Tri',       name: 'Tri',        prefixes: ['0895','0896','0897','0898','0899'], color: '#DC2626', icon: '🔴' },
  { id: 'Smartfren', name: 'Smartfren',  prefixes: ['0881','0882','0883','0884','0885','0886','0887','0888'], color: '#10B981', icon: '🟢' },
  { id: 'by.U',      name: 'by.U',        prefixes: ['0868'], color: '#6366F1', icon: '🔵' },
];

export function detectProvider(phone: string): Provider | null {
  const clean = phone.replace(/\D/g, '');
  for (const p of PROVIDERS) {
    if (p.prefixes.some((prefix) => clean.startsWith(prefix))) {
      return p;
    }
  }
  return null;
}

// ─── Products ──────────────────────────────────────────────────────────────────

export async function getProductsByBrand(brand: string): Promise<PulsaProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('brand', brand)
    .eq('is_active', true)
    .order('harga_jual', { ascending: true });

  if (error) {
    console.error('Error fetching products by brand:', error);
    return [];
  }

  return data || [];
}

export async function getProductsByCategory(category: string): Promise<PulsaProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('harga_jual', { ascending: true });

  if (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }

  return data || [];
}

export async function getAllActiveProducts(): Promise<PulsaProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('brand', { ascending: true })
    .order('harga_jual', { ascending: true });

  if (error) {
    console.error('Error fetching all active products:', error);
    return [];
  }

  return data || [];
}

export async function searchProducts(
  brand: string,
  searchTerm: string
): Promise<PulsaProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('brand', brand)
    .eq('is_active', true)
    .ilike('product_name', `%${searchTerm}%`)
    .order('harga_jual', { ascending: true });

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  return data || [];
}

// ─── Categories ───────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  iconKey: string | null;
  icon: string;
  color: string;
  bg: string;
}

export const CATEGORIES: Category[] = [
  { id: 'Pulsa',       name: 'Pulsa',       iconKey: 'pulsa',   icon: 'phone-portrait-outline', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'Paket Data',  name: 'Paket Data',  iconKey: 'data',   icon: 'wifi-outline',          color: '#10B981', bg: '#ECFDF5' },
  { id: 'Token PLN',   name: 'Token PLN',   iconKey: 'pln',    icon: 'flash-outline',          color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'Games',       name: 'Games',       iconKey: 'games', icon: 'game-controller-outline', color: '#EC4899', bg: '#FDF2F8' },
  { id: 'E-Wallet',   name: 'E-Wallet',   iconKey: 'emoney', icon: 'wallet-outline',         color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'TV Kabel',   name: 'TV Kabel',   iconKey: null,    icon: 'tv-outline',             color: '#06B6D4', bg: '#ECFEFF' },
  { id: 'Lainnya',    name: 'Lainnya',    iconKey: null,    icon: 'apps-outline',           color: '#64748B', bg: '#F1F5F9' },
];
