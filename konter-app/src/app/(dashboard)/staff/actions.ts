'use server'

import { processPurchase } from '@/use-cases/transactions/purchase'
import { createClient } from '@/infrastructure/supabase/server'
import { revalidatePath } from 'next/cache'

export async function buyProduct(formData: FormData): Promise<void> {
  const skuCode = formData.get('sku_code') as string
  const customerNo = formData.get('customer_no') as string

  if (!skuCode || !customerNo) {
    return
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  const result = await processPurchase(user.id, skuCode, customerNo)

  if (result.success) {
    revalidatePath('/staff')
    revalidatePath('/staff/history')
  }
}
