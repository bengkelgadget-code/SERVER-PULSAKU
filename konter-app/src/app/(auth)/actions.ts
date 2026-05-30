'use server'

import { createClient } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=Could not authenticate user')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (userData?.role === 'superadmin') {
      return redirect('/superadmin')
    } else if (userData?.role === 'admin') {
      return redirect('/admin')
    } else {
      return redirect('/staff')
    }
  }

  return redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/login')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return redirect('/register?error=Could not authenticate user')
  }

  return redirect('/login?message=Check email to continue sign in process')
}
