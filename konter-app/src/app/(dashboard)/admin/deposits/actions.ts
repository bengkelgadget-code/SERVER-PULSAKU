'use server'

import { createClient } from '@/infrastructure/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processDeposit(formData: FormData): Promise<void> {
  const deposit_id = formData.get('deposit_id') as string
  const action = formData.get('action') as string // 'approve' or 'reject'
  const user_id = formData.get('user_id') as string
  const amount = parseFloat(formData.get('amount') as string)

  const supabase = await createClient()

  if (action === 'approve') {
    const { data: deposit } = await supabase
      .from('deposits')
      .select('status')
      .eq('id', deposit_id)
      .single()

    if (deposit?.status !== 'pending') {
      return
    }

    const { error: depositError } = await supabase
      .from('deposits')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', deposit_id)

    if (depositError) return

    const { data: user } = await supabase
      .from('users')
      .select('saldo')
      .eq('id', user_id)
      .single()

    if (user) {
      const newSaldo = parseFloat(user.saldo) + amount
      await supabase.from('users').update({ saldo: newSaldo }).eq('id', user_id)
    }

  } else if (action === 'reject') {
    await supabase
      .from('deposits')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', deposit_id)
  }

  revalidatePath('/admin/deposits')
}
