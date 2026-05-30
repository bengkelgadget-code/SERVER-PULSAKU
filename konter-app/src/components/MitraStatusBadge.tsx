'use client'

import { Badge } from '@/components/ui/badge'

interface MitraStatusBadgeProps {
  saldo: number
}

export function MitraStatusBadge({ saldo }: MitraStatusBadgeProps) {
  const isActive = saldo > 0

  return (
    <Badge
      variant="outline"
      className={isActive
        ? 'bg-green-500/10 text-green-600 border-green-500/30'
        : 'bg-zinc-500/10 text-zinc-500 border-zinc-300'
      }
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-green-500' : 'bg-zinc-400'}`} />
      {isActive ? 'Aktif' : 'Nonaktif'}
    </Badge>
  )
}