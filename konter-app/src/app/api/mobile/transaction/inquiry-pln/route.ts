import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { digiflazz } from '@/infrastructure/digiflazz/client'

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization')
  
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: authHeader || '',
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { customer_no } = await request.json()

    if (!customer_no) {
      return NextResponse.json({ error: 'customer_no is required' }, { status: 400 })
    }

    const inquiryResult = await digiflazz.inquiryPln(customer_no)

    if (inquiryResult) {
      return NextResponse.json({
        success: true,
        name: inquiryResult.name,
        segment_power: inquiryResult.segment_power,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Gagal mengecek nama pelanggan. Pastikan nomor meter valid.',
      })
    }
  } catch (error: unknown) {
    console.error('Mobile inquiry error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
