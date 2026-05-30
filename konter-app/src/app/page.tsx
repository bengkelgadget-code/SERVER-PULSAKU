import { createClient } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = userData?.role

  switch (role) {
    case 'superadmin':
      redirect('/superadmin')
    case 'admin':
      redirect('/admin')
    case 'staff':
      redirect('/staff')
    default:
      redirect('/login')
  }
}
