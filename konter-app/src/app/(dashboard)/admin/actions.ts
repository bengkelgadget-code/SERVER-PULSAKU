'use server'

import { syncDigiFlazzProducts } from '@/use-cases/products/sync-digiflazz'
import { createClient } from '@/infrastructure/supabase/server'
import { revalidatePath } from 'next/cache'

export async function syncProductsAction(): Promise<void> {
  await syncDigiFlazzProducts()
  revalidatePath('/admin')
}

export async function updateProductPrice(formData: FormData): Promise<void> {
  const sku_code = formData.get('sku_code') as string
  const harga_jual = parseFloat(formData.get('harga_jual') as string)

  if (!sku_code || isNaN(harga_jual)) {
    throw new Error('SKU atau harga jual tidak valid')
  }

  const supabase = await createClient()

  // Get current user for validation & logs
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error("Auth error in updateProductPrice:", authError)
    throw new Error('Unauthorized')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log(`[Price Update] User: ${user.email}, Role: ${userData?.role}, SKU: ${sku_code}, New Price: ${harga_jual}`)

  const { data, error } = await supabase
    .from('products')
    .update({ harga_jual })
    .eq('sku_code', sku_code)
    .select()

  if (error) {
    console.error("Supabase error updating price:", error.message, error.details)
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    console.error(`[Price Update] Error: No rows updated for SKU ${sku_code}. RLS policy check failed or SKU not found.`)
    throw new Error('Gagal menyimpan harga: Tidak memiliki izin (RLS) atau produk tidak ditemukan.')
  }

  console.log("[Price Update] Database update successful:", data)

  revalidatePath('/admin')
}

export async function toggleProductStatus(formData: FormData): Promise<void> {
  const sku_code = formData.get('sku_code') as string
  const current_status = formData.get('current_status') === 'true'

  const supabase = await createClient()

  await supabase
    .from('products')
    .update({ is_active: !current_status })
    .eq('sku_code', sku_code)

  revalidatePath('/admin')
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const sku_code = formData.get('sku_code') as string

  const supabase = await createClient()

  await supabase
    .from('products')
    .delete()
    .eq('sku_code', sku_code)

  revalidatePath('/admin')
}

export async function addBalanceAdmin(formData: FormData): Promise<void> {
  const user_id = formData.get('user_id') as string
  const amount = parseFloat(formData.get('amount') as string)

  if (!user_id || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount or user')
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('add_balance', {
    p_user_id: user_id,
    p_amount: amount,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/users')
}

export async function addBalanceDirect(formData: FormData): Promise<void> {
  const user_id = formData.get('user_id') as string
  const amount = parseFloat(formData.get('amount') as string)

  if (!user_id || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount or user')
  }

  const supabase = await createClient()

  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) throw new Error('Unauthorized')

  // Check admin balance
  const { data: adminData } = await supabase.from('users').select('saldo').eq('id', adminUser.id).single()
  if (!adminData) throw new Error('Admin not found')

  if (Number(adminData.saldo) < amount) {
    throw new Error('Saldo Pusat tidak mencukupi untuk transfer ini.')
  }

  // Get current balance
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('saldo')
    .eq('id', user_id)
    .single()

  if (fetchError || !user) {
    throw new Error('User not found')
  }

  const newSaldo = Number(user.saldo) + amount
  const newAdminSaldo = Number(adminData.saldo) - amount

  const { error } = await supabase
    .from('users')
    .update({ saldo: newSaldo })
    .eq('id', user_id)

  if (error) {
    throw new Error(error.message)
  }

  // Deduct admin balance
  await supabase
    .from('users')
    .update({ saldo: newAdminSaldo })
    .eq('id', adminUser.id)

  revalidatePath('/admin/users')
}

export async function updateUserRole(formData: FormData): Promise<void> {
  const user_id = formData.get('user_id') as string
  const new_role = formData.get('new_role') as 'superadmin' | 'admin' | 'staff'

  if (!user_id || !new_role) {
    throw new Error('Invalid parameters')
  }

  const supabase = await createClient()

  // Check caller role (must be superadmin)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (caller?.role !== 'superadmin') {
    throw new Error('Hanya Super Admin yang dapat mengubah role')
  }

  // Cannot demote self
  if (user_id === user.id && new_role !== 'superadmin') {
    throw new Error('Tidak dapat mengubah role sendiri')
  }

  const { error } = await supabase
    .from('users')
    .update({ role: new_role })
    .eq('id', user_id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/superadmin/users')
}
