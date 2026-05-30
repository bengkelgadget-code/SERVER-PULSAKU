import { createClient } from '@/infrastructure/supabase/server'
import { createAdminClient } from '@/infrastructure/supabase/admin'
import { NextResponse } from 'next/server'

// WARNING: Deletes ALL users except the currently logged-in superadmin
export async function DELETE() {
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

  if (currentUser?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 })
  }

  try {
    const adminClient = createAdminClient()

    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const results = []
    for (const u of users) {
      if (u.id === user.id) {
        results.push({ id: u.id, email: u.email, deleted: false, error: 'Cannot delete yourself' })
        continue
      }
      const { error } = await adminClient.auth.admin.deleteUser(u.id)
      results.push({ id: u.id, email: u.email, deleted: !error, error: error?.message || null })
    }

    const successCount = results.filter(r => r.deleted).length
    const failCount = results.filter(r => !r.deleted).length

    return NextResponse.json({
      success: true,
      message: `Deleted ${successCount} users, ${failCount} failed`,
      results,
    })

  } catch (error: unknown) {
    console.error('Error deleting users:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}