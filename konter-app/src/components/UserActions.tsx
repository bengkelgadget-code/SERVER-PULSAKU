'use client'

import { Button } from '@/components/ui/button'
import { updateUserRole } from '@/app/(dashboard)/admin/actions'
import { useTransition } from 'react'

interface UserActionsProps {
  userId: string
  currentRole: 'superadmin' | 'admin' | 'staff'
  isSelf: boolean
}

export function UserActions({ userId, currentRole, isSelf }: UserActionsProps) {
  const [isPending, startTransition] = useTransition()

  const handleChangeRole = (newRole: 'superadmin' | 'admin' | 'staff') => {
    if (isSelf && newRole !== 'superadmin') {
      alert('Tidak dapat mengubah role sendiri.')
      return
    }

    const confirmMsg = isSelf
      ? 'Yakin ingin mengubah role diri sendiri?'
      : `Yakin ingin mengubah role user ini menjadi ${newRole.replace('_', ' ')}?`

    if (!confirm(confirmMsg)) return

    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('new_role', newRole)

    startTransition(async () => {
      try {
        await updateUserRole(formData)
        window.location.reload()
      } catch (error) {
        alert('Gagal mengubah role: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    })
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {currentRole === 'staff' && (
        <>
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
            onClick={() => handleChangeRole('admin')}
            disabled={isPending}
          >
            Jadikan Admin
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => handleChangeRole('superadmin')}
            disabled={isPending}
          >
            Jadikan Super Admin
          </Button>
        </>
      )}
      {currentRole === 'admin' && (
        <>
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="text-zinc-600 border-zinc-300 hover:bg-zinc-50"
            onClick={() => handleChangeRole('staff')}
            disabled={isPending}
          >
            Turunkan ke Staff
          </Button>
          {!isSelf && (
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => handleChangeRole('superadmin')}
              disabled={isPending}
            >
              Jadikan Super Admin
            </Button>
          )}
        </>
      )}
      {currentRole === 'superadmin' && (
        <span className="text-xs text-muted-foreground italic">
          {isSelf ? '(Anda)' : '-'}
        </span>
      )}
    </div>
  )
}