'use server'

import { createClient } from '@/infrastructure/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestDeposit(formData: FormData): Promise<void> {
  const amountStr = formData.get('amount') as string
  const amount = parseFloat(amountStr)

  if (isNaN(amount) || amount <= 0) {
    return
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  const { error } = await supabase
    .from('deposits')
    .insert({
      user_id: user.id,
      amount,
      status: 'pending'
    })

  if (error) {
    return
  }

  revalidatePath('/staff/deposit')
}
