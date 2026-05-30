import { createClient } from '@/infrastructure/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!currentUser?.role || !['superadmin', 'admin'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin or Super Admin only' }, { status: 403 })
  }

  // Super Admin sees all users; Admin sees only their staff
  let query = supabase
    .from('users')
    .select('id, email, role, saldo, nama_toko, admin_id, created_at')
    .order('created_at', { ascending: false })

  if (currentUser.role === 'admin') {
    query = query.eq('role', 'staff').eq('admin_id', user.id)
  }

  const { data: users, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    users,
    message: 'User passwords cannot be retrieved from client-side queries. Use Supabase Dashboard > Authentication > Users to manage passwords.'
  })
}
