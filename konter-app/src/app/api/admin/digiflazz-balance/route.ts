import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { digiflazz } from '@/infrastructure/digiflazz/client'

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: Request) {
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

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  // Only admin and superadmin can view digiflazz balance
  if (!userData?.role || !['admin', 'superadmin'].includes(userData.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders })
  }

  try {
    const balance = await digiflazz.getBalance()
    return NextResponse.json({ success: true, balance }, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Digiflazz Balance API error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch balance' }, { status: 500, headers: corsHeaders })
  }
}
