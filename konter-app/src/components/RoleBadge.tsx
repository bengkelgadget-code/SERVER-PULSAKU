'use client'

import { Badge } from '@/components/ui/badge'

interface RoleBadgeProps {
  role: 'superadmin' | 'admin' | 'staff'
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = {
    superadmin: {
      label: 'Super Admin',
      className: 'bg-red-500/10 text-red-600 border-red-500/30',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    admin: {
      label: 'Admin',
      className: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    staff: {
      label: 'Staff',
      className: 'bg-zinc-500/10 text-zinc-600 border-zinc-300',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  }

  const { label, className, icon } = config[role] || config.staff

  return (
    <Badge variant="outline" className={className}>
      {icon}
      {label}
    </Badge>
  )
}