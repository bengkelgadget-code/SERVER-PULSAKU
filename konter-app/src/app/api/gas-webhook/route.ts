import { NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/supabase/server'

export async function POST(request: Request) {
  try {
    const { transaction_id } = await request.json()
    if (!transaction_id) {
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 })
    }

    const gasUrl = process.env.GOOGLE_APPS_SCRIPT_URL
    if (!gasUrl) {
      console.warn('Google Apps Script URL is not configured')
      return NextResponse.json({ message: 'GAS URL not configured' })
    }

    const supabase = await createClient()

    const { data: trx, error } = await supabase
      .from('transactions')
      .select(`
        id, created_at, customer_no, ref_id, harga_modal, harga_jual, status, sn,
        users ( nama_toko, email ),
        products ( product_name, category, brand )
      `)
      .eq('id', transaction_id)
      .single()

    if (error || !trx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Prepare payload for GAS
    const trxUsers = trx.users as { nama_toko?: string; email?: string } | null
    const trxProducts = trx.products as { product_name?: string; category?: string; brand?: string } | null

    const payload = {
      timestamp: trx.created_at,
      transaction_id: trx.id,
      ref_id: trx.ref_id,
      mitra_name: trxUsers?.nama_toko || trxUsers?.email,
      product_name: trxProducts?.product_name,
      category: trxProducts?.category,
      customer_no: trx.customer_no,
      harga_modal: trx.harga_modal,
      harga_jual: trx.harga_jual,
      profit: trx.harga_jual - trx.harga_modal,
      status: trx.status,
      sn: trx.sn
    }

    // Send to Google Apps Script Webhook
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.error('Failed to send to GAS', await response.text())
      return NextResponse.json({ error: 'Failed to send to GAS' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("GAS Webhook Proxy Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
