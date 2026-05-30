import { supabase, User } from '@/lib/supabase';

export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'email' | 'nama_toko'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Terjadi kesalahan saat update profil' };
  }
}

export async function updateSaldo(
  userId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current saldo
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('saldo')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return { success: false, error: 'User tidak ditemukan' };
    }

    const newSaldo = user.saldo + amount;

    const { error: updateError } = await supabase
      .from('users')
      .update({ saldo: newSaldo, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Terjadi kesalahan saat update saldo' };
  }
}