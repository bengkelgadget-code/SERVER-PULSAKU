import { createClient } from '@supabase/supabase-js'

// Admin client menggunakan service_role key
// HANYA digunakan di server-side (API routes), TIDAK PERNAH di client
// Client ini bypass RLS dan memiliki akses penuh ke database

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
