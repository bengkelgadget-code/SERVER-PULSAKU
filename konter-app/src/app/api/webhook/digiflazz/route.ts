import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/infrastructure/supabase/server'

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-hub-signature')
    const secret = process.env.DIGIFLAZZ_WEBHOOK_SECRET

    if (!secret) {
      console.warn('Webhook secret is not configured')
      return NextResponse.json({ error: 'Webhook Secret Not Configured' }, { status: 500 })
    }

    const payload = await request.text()
    
    // Validate Signature
    const hash = crypto.createHmac('sha1', secret).update(payload).digest('hex')
    const expectedSignature = `sha1=${hash}`

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 })
    }

    const body = JSON.parse(payload)
    const { ref_id, status, sn } = body.data

    if (!ref_id || !status) {
      return NextResponse.json({ error: 'Invalid Payload' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Get current transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('ref_id', ref_id)
      .single()

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Map DigiFlazz status to DB status
    const dfStatus = status.toLowerCase()
    let dbStatus = 'pending'
    if (dfStatus === 'sukses') dbStatus = 'sukses'
    if (dfStatus === 'gagal') dbStatus = 'gagal'

    // If status is the same or already final, do nothing
    if (transaction.status === dbStatus || transaction.status === 'sukses' || transaction.status === 'gagal') {
      return NextResponse.json({ message: 'No update needed' })
    }

    // 2. Update transaction
    await supabase
      .from('transactions')
      .update({ 
        status: dbStatus, 
        sn: sn || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    // 3. If failed, refund the user
    if (dbStatus === 'gagal') {
      await supabase.rpc('refund_purchase', { p_transaction_id: transaction.id })
    }

    // 4. (Phase 4 Hook) If success, trigger Google Apps Script
    if (dbStatus === 'sukses') {
      // Background execution for GAS Webhook
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gas-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: transaction.id })
      }).catch(err => console.error("Failed to trigger GAS webhook:", err))
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Webhook Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
