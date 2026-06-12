import { createClient } from '@/infrastructure/supabase/server'
import { syncDigiFlazzProducts } from '@/use-cases/products/sync-digiflazz'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST() {
  try {
    const supabase = await createClient()

    let user;
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        return NextResponse.json({ success: false, error: 'Sesi berakhir, silakan login ulang.' }, { status: 401 })
      }
      user = data.user;
    } catch (authErr) {
      return NextResponse.json({ success: false, error: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 })
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
