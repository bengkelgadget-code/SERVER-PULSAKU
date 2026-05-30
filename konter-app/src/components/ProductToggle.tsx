'use client'

import { useState, useTransition } from 'react'
import { toggleProductStatus } from '@/app/(dashboard)/admin/actions'
import { cn } from '@/lib/utils'

interface ProductToggleProps {
  skuCode: string
  isActive: boolean
}

export function ProductToggle({ skuCode, isActive: initialIsActive }: ProductToggleProps) {
  const [isActive, setIsActive] = useState(initialIsActive)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    const newStatus = !isActive
    setIsActive(newStatus)

    const formData = new FormData()
    formData.append('sku_code', skuCode)
    formData.append('current_status', isActive.toString())

    startTransition(async () => {
      await toggleProductStatus(formData)
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        isActive ? 'bg-green-500' : 'bg-muted-foreground/30'
      )}
      aria-label={`Toggle product ${isActive ? 'active' : 'inactive'}`}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
          isActive ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}