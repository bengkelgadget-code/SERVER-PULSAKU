import { createClient } from '@/infrastructure/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' })
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    auth_user: {
      id: user.id,
      email: user.email,
    },
    public_user: userData,
    error: error
  })
}
