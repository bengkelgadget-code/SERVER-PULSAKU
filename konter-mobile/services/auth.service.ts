import { supabase, User } from '@/lib/supabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Login gagal' };
    }

    // Fetch user profile from our users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Gagal mengambil data profil' };
    }

    return { success: true, user: profile };
  } catch (err: unknown) {
    console.error('Login error:', err);
    return { success: false, error: (err as Error).message || 'Terjadi kesalahan saat login' };
  }
}

export async function register(credentials: RegisterCredentials): Promise<AuthResult> {
  try {
    if (credentials.password.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter' };
    }

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Registrasi gagal' };
    }

    // Create user profile (trigger on Supabase will also create one, but we set our fields)
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email: credentials.email,
      role: 'staff',
      saldo: 0,
      nama_toko: credentials.name || null,
    });

    if (profileError) {
      console.warn('Profile insert warning:', profileError.message);
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return { success: true, user: profile };
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return { success: false, error: (err as Error).message || 'Terjadi kesalahan saat registrasi' };
  }
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return profile;
}
