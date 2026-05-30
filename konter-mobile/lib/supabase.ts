import { createClient } from '@supabase/supabase-js';

// ─── In-memory storage adapter for Expo Go compatibility ─────────────────────
class MemoryStorage {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  async getItemAsync(key: string): Promise<string | null> {
    return this.getItem(key);
  }

  async setItemAsync(key: string, value: string): Promise<void> {
    this.setItem(key, value);
  }

  async removeItemAsync(key: string): Promise<void> {
    this.removeItem(key);
  }
}

const memoryStorage = new MemoryStorage();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: memoryStorage as any,
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

// ─── Type Definitions ──────────────────────────────────────────────────────────
// These types match the Supabase `users` and `transactions` tables directly.

// Mobile app: uses email as display name, derives avatar initials from email
export type User = {
  id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'staff';
  saldo: number;
  nama_toko: string | null;
  created_at: string;
  name?: string;             // derived: nama_toko or email prefix (for UI convenience)
  avatar_initials?: string;  // derived: first char of email (for UI convenience)
};

// Helpers for UI components that expect `name` / `avatar_initials`
export type UserWithDerivedFields = User & {
  name: string;             // derived: nama_toko or email prefix
  avatar_initials: string;  // derived: first 2 chars of email
};

// Derive UI fields from User
export function deriveUserFields(user: User): UserWithDerivedFields {
  const name = user.nama_toko || user.email.split('@')[0];
  const avatar_initials = user.email[0]?.toUpperCase() || 'U';
  return { ...user, name, avatar_initials };
}

// Transactions table: status is 'pending' | 'sukses' | 'gagal'
// (matches web app schema)
export type Transaction = {
  id: string;
  user_id: string;
  sku_code?: string;        // from products table
  customer_no?: string;
  ref_id?: string;
  harga_modal?: number;
  harga_jual?: number;
  type: string;             // e.g. "Pulsa", "Paket Data"
  detail?: string;         // product name
  amount?: number;          // harga_jual (negative in some web app flows)
  status: 'pending' | 'sukses' | 'gagal';
  sn?: string;
  rc?: string;
  created_at: string;
};
