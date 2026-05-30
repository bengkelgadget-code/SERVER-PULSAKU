'use client'

import { useState } from 'react'
import { updateProductPrice } from '@/app/(dashboard)/admin/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PriceInputFormProps {
  skuCode: string
  initialPrice: number
}

export function PriceInputForm({ skuCode, initialPrice }: PriceInputFormProps) {
  const [value, setValue] = useState(initialPrice)

  return (
    <form action={updateProductPrice} className="flex gap-2 items-center">
      <input type="hidden" name="sku_code" value={skuCode} />
      <Input
        name="harga_jual"
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-24 font-bold border-primary/20 focus-visible:ring-primary/50 text-sm"
      />
      <Button type="submit" size="xs" variant="secondary" className="hover:bg-primary/10 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 transition-opacity">Save</Button>
    </form>
  )
}
