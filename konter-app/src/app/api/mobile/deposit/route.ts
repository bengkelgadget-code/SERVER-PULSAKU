import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { amount } = await request.json()

    if (!amount || amount < 10000) {
      return NextResponse.json({ error: 'Minimal deposit Rp 10.000' }, { status: 400 })
    }

    // 2. Generate unique code and ensure no pending collision
    let unique_code = 0
    let total_amount = 0
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      // Random 1 to 999
      unique_code = Math.floor(Math.random() * 999) + 1
      total_amount = amount + unique_code

      // Check collision
      const { data: existing } = await supabase
        .from('deposits')
        .select('id')
        .eq('total_amount', total_amount)
        .eq('status', 'pending')
        .maybeSingle()

      if (!existing) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Sistem sedang sibuk, silakan coba lagi' }, { status: 500 })
    }

    // 3. Insert to database
    const { data: deposit, error: insertError } = await supabase
      .from('deposits')
      .insert({
        user_id: user.id,
        amount: amount,
        unique_code: unique_code,
        total_amount: total_amount,
        status: 'pending'
      })
      .select('*')
      .single()

    if (insertError || !deposit) {
      console.error('Deposit insert error:', insertError)
      return NextResponse.json({ error: 'Gagal membuat tiket deposit' }, { status: 500 })
    }

    // 4. Return instructions
    return NextResponse.json({
      success: true,
      deposit: deposit,
      payment_instruction: {
        bank: 'Seabank',
        account_number: '9016 7607 9069',
        account_name: 'Zainal Ilmi',
        exact_amount: total_amount
      }
    })

  } catch (error: unknown) {
    console.error('Deposit error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}
