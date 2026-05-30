'use client'

import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ProductToggle } from '@/components/ProductToggle'
import { ProductActions } from '@/components/ProductActions'
import { PriceInputForm } from '@/components/PriceInputForm'

interface ProductRowProps {
  product: {
    sku_code: string
    product_name: string
    brand: string
    harga_modal: number
    harga_jual: number
    is_active: boolean
  }
}

export function ProductRow({ product }: ProductRowProps) {
  return (
    <TableRow className="hover:bg-primary/5 transition-colors group">
      <TableCell className="font-mono text-xs pl-4">{product.sku_code}</TableCell>
      <TableCell className="font-medium max-w-[200px] truncate">{product.product_name}</TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-white/50 dark:bg-black/20 whitespace-nowrap">{product.brand}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground whitespace-nowrap">{product.harga_modal.toLocaleString('id-ID')}</TableCell>
      <TableCell className="whitespace-nowrap">
        <PriceInputForm skuCode={product.sku_code} initialPrice={product.harga_jual} />
      </TableCell>
      <TableCell className="text-center">
        <ProductToggle skuCode={product.sku_code} isActive={product.is_active} />
      </TableCell>
      <TableCell className="text-center pr-4">
        <ProductActions skuCode={product.sku_code} />
      </TableCell>
    </TableRow>
  )
}