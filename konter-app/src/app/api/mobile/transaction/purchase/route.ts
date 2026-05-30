/**
 * Mobile Purchase API
 * Called by mobile app to process a purchase.
 * Flow: lock saldo + create transaction → call DigiFlazz → update status → refund if failed
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
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

  const { data: userData } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  // Only staff can purchase via this endpoint (admin uses web)
  if (!userData?.role || !['staff', 'admin', 'superadmin'].includes(userData.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { sku_code, customer_no } = await request.json()

    if (!sku_code || !customer_no) {
      return NextResponse.json({ error: 'sku_code and customer_no are required' }, { status: 400 })
    }

    // 1. Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('harga_modal, harga_jual, is_active')
      .eq('sku_code', sku_code)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.is_active) {
      return NextResponse.json({ error: 'Product is currently inactive' }, { status: 400 })
    }

    // 2. Generate ref_id
    const refId = `MOB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    // 3. Lock saldo + create pending transaction via RPC
    const { data: transactionId, error: rpcError } = await supabase.rpc('process_purchase', {
      p_user_id: user.id,
      p_amount: product.harga_jual,
      p_sku_code: sku_code,
      p_customer_no: customer_no,
      p_ref_id: refId,
      p_harga_modal: product.harga_modal,
      p_harga_jual: product.harga_jual,
    })

    if (rpcError) {
      return NextResponse.json(
        { success: false, error: rpcError.message || 'Insufficient balance or server error' },
        { status: 400 }
      )
    }

    // 4. Call DigiFlazz
    try {
      const response = await digiflazz.createTransaction(sku_code, customer_no, refId)

      const dfStatus = response.data.status.toLowerCase()
      let dbStatus = 'pending'
      if (dfStatus === 'sukses') dbStatus = 'sukses'
      if (dfStatus === 'gagal') dbStatus = 'gagal'

      // Update transaction status
      await supabase
        .from('transactions')
        .update({
          status: dbStatus,
          sn: response.data.sn || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)

      // If failed, refund
      if (dbStatus === 'gagal') {
        await supabase.rpc('refund_purchase', { p_transaction_id: transactionId })
        return NextResponse.json({
          success: false,
          error: `Transaction failed: ${response.data.message}`,
          status: dbStatus,
          ref_id: refId,
        })
      }

      return NextResponse.json({
        success: true,
        transactionId,
        status: dbStatus,
        ref_id: refId,
        sn: response.data.sn,
        harga_jual: product.harga_jual,
      })

    } catch (digiflazzError) {
      // DigiFlazz call failed — transaction stays 'pending', webhook will update it
      console.error('DigiFlazz call failed:', digiflazzError)
      return NextResponse.json({
        success: true,
        transactionId,
        status: 'pending',
        ref_id: refId,
        note: 'Waiting for supplier confirmation',
        harga_jual: product.harga_jual,
      })
    }

  } catch (error: unknown) {
    console.error('Mobile purchase error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}