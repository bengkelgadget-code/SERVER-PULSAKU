'use client'

import { deleteProductAction } from '@/app/(dashboard)/admin/actions'

interface ProductActionsProps {
  skuCode: string
}

export function ProductActions({ skuCode }: ProductActionsProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        className="inline-flex items-center justify-center size-6 rounded-[min(var(--radius-md),10px)] text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Edit"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <form action={deleteProductAction} className="inline-flex">
        <input type="hidden" name="sku_code" value={skuCode} />
        <button
          type="submit"
          className="inline-flex items-center justify-center size-6 rounded-[min(var(--radius-md),10px)] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Delete"
          onClick={(e) => { if (!confirm('Hapus produk ini?')) e.preventDefault() }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </form>
    </div>
  )
}