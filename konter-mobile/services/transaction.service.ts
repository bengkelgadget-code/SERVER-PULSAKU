import { supabase, Transaction } from '@/lib/supabase';

export type TransactionFilter = 'Semua' | 'Sukses' | 'Proses' | 'Gagal';

/**
 * Status mapping: DB ('pending'|'sukses'|'gagal') → UI display
 */
const STATUS_MAP: Record<TransactionFilter, string> = {
  'Semua': '',
  'Sukses': 'sukses',
  'Proses': 'pending',
  'Gagal': 'gagal',
};

// ─── Fetch Transactions ────────────────────────────────────────────────────────
// Uses the `transactions` table from Supabase (synced from web app purchase flow)

export async function getTransactions(
  userId: string,
  filter?: TransactionFilter
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filter && filter !== 'Semua') {
    const dbStatus = STATUS_MAP[filter];
    if (dbStatus) {
      query = query.eq('status', dbStatus);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  // Map DB fields to Transaction type fields for UI compatibility
  return (data || []).map((trx) => ({
    id: trx.id,
    user_id: trx.user_id,
    sku_code: trx.sku_code,
    customer_no: trx.customer_no,
    ref_id: trx.ref_id,
    harga_modal: trx.harga_modal,
    harga_jual: trx.harga_jual,
    type: trx.sku_code?.startsWith('PLN') ? 'Token PLN' : 'Pulsa',
    detail: trx.ref_id,
    amount: trx.harga_jual,
    status: trx.status,
    sn: trx.sn,
    created_at: trx.created_at,
  }));
}

// ─── Transaction Stats ────────────────────────────────────────────────────────

export async function getTransactionStats(userId: string): Promise<{
  totalCount: number;
  successCount: number;
  failedCount: number;
  totalExpense: number;
  totalDeposit: number;
}> {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  if (error || !transactions) {
    return { totalCount: 0, successCount: 0, failedCount: 0, totalExpense: 0, totalDeposit: 0 };
  }

  const success = transactions.filter(t => t.status === 'sukses');
  const failed = transactions.filter(t => t.status === 'gagal');

  // totalExpense = sum of all successful transaction prices (harga_jual)
  const expense = success.reduce((sum, t) => sum + Number(t.harga_jual || 0), 0);

  return {
    totalCount: transactions.length,
    successCount: success.length,
    failedCount: failed.length,
    totalExpense: expense,
    totalDeposit: 0, // deposits tracked separately in the deposits table
  };
}
