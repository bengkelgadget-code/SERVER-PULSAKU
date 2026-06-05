import { createClient } from '@/infrastructure/supabase/server'
import { syncDigiFlazzProducts } from '@/use-cases/products/sync-digiflazz'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST() {
  try {
    const supabase = await createClient()

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin' && userData?.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const result = await syncDigiFlazzProducts()
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Sync API error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
