import { type NextRequest } from 'next/server'
import { updateSession } from '@/infrastructure/supabase/middleware'

export function proxy(request: NextRequest) {
  return updateSession(request)
}