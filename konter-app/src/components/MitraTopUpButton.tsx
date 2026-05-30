'use client'

import { Button } from '@/components/ui/button'
import { addBalanceDirect } from '@/app/(dashboard)/admin/actions'
import { useTransition } from 'react'

interface MitraTopUpButtonProps {
  userId: string
  email?: string
  namaToko?: string
}

export function MitraTopUpButton({ userId, email, namaToko }: MitraTopUpButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleTopUp = () => {
    const amountStr = prompt(
      `Top Up untuk ${namaToko || email || userId}\n\nMasukkan jumlah top up (Rp):`
    )

    if (!amountStr) return

    const amount = parseFloat(amountStr.replace(/[^0-9.]/g, ''))
    if (isNaN(amount) || amount <= 0) {
      alert('Jumlah tidak valid.')
      return
    }

    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('amount', amount.toString())

    startTransition(async () => {
      try {
        await addBalanceDirect(formData)
        alert('Top up berhasil!')
        window.location.reload()
      } catch (error) {
        alert('Top up gagal: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    })
  }

  return (
    <Button
      type="button"
      size="xs"
      variant="outline"
      className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
      onClick={handleTopUp}
      disabled={isPending}
    >
      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Top Up
    </Button>
  )
}