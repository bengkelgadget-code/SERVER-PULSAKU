import { createClient } from '@/infrastructure/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Not logged in', details: userError })
  }

  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Let's also check if we can call the RPC directly
  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin')

  return NextResponse.json({
    auth_user: { id: user.id, email: user.email },
    db_user: userData,
    db_error: dbError,
    is_admin_rpc: isAdmin,
    rpc_error: rpcError
  })
}
