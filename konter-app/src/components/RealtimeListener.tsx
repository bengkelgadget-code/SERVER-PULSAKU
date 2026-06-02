'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/infrastructure/supabase/client'

export function RealtimeListener({ userId, role }: { userId?: string, role?: string }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const userChannel = supabase
      .channel('web-user-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    const filterStr = (role === 'admin' || role === 'superadmin') ? undefined : `user_id=eq.${userId}`

    const txChannel = supabase
      .channel('web-tx-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: filterStr },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(userChannel)
      supabase.removeChannel(txChannel)
    }
  }, [userId, role, router, supabase])

  return null
}
