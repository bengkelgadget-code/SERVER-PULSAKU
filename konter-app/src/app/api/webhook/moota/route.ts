import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/infrastructure/supabase/server'

// Note: Ensure you set MOOTA_WEBHOOK_SECRET in your Vercel Environment Variables.
export async function POST(request: Request) {
  try {
    const signature = request.headers.get('signature')
    const secret = process.env.MOOTA_WEBHOOK_SECRET

    if (!secret) {
      console.warn('Moota webhook secret is not configured')
      return NextResponse.json({ error: 'Webhook Secret Not Configured' }, { status: 500 })
    }

    const payload = await request.text()
    
    // Validate Signature: Moota uses HMAC SHA256 of the payload
    const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex')

    if (signature !== hash) {
      return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 })
    }

    const mutations = JSON.parse(payload)

    if (!Array.isArray(mutations)) {
      return NextResponse.json({ error: 'Invalid Payload Format' }, { status: 400 })
    }

    const supabase = await createClient()

    let processedCount = 0

    // Process each mutation
    for (const mutation of mutations) {
      // We only care about Credit (CR) / Uang Masuk
      if (mutation.type === 'CR') {
        const amount = mutation.amount

        // Find a pending deposit that matches this exact amount
        const { data: deposit } = await supabase
          .from('deposits')
          .select('id')
          .eq('total_amount', amount)
          .eq('status', 'pending')
          .maybeSingle()

        if (deposit) {
          // Approve deposit using RPC to avoid race conditions
          const { data: success, error: rpcError } = await supabase.rpc('approve_deposit', {
            p_deposit_id: deposit.id
          })

          if (!rpcError && success) {
            processedCount++
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: processedCount })

  } catch (error) {
    console.error("Moota Webhook Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
