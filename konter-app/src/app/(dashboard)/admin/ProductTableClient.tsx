'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Check, Loader2 } from 'lucide-react'
import { updateProductPrice, toggleProductStatus } from './actions'

interface ProductTableClientProps {
  initialProducts: any[]
}

export function ProductTableClient({ initialProducts }: ProductTableClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({})
  const [loadingSku, setLoadingSku] = useState<string | null>(null)
  
  // Sync state when initialProducts prop changes due to filter updates
  useEffect(() => {
    setProducts(initialProducts)
    setEditedPrices({})
  }, [initialProducts])

  const handlePriceChange = (sku: string, value: string) => {
    setEditedPrices(prev => ({
      ...prev,
      [sku]: value
    }))
  }

  const handleSave = async (sku: string) => {
    const newPrice = editedPrices[sku]
    if (!newPrice) return

    setLoadingSku(sku)
    try {
      const formData = new FormData()
      formData.append('sku_code', sku)
      formData.append('harga_jual', newPrice)
      
      await updateProductPrice(formData)
      
      // Update local state value
      setProducts(prev => prev.map(p => {
        if (p.sku_code === sku) {
          return { ...p, harga_jual: parseFloat(newPrice) }
        }
        return p
      }))
      
      // Clear edited state for this SKU
      setEditedPrices(prev => {
        const next = { ...prev }
        delete next[sku]
        return next
      })
    } catch (err) {
      console.error("Gagal menyimpan harga:", err)
    } finally {
      setLoadingSku(null)
    }
  }

  const handleToggleActive = async (sku: string, currentStatus: boolean) => {
    setLoadingSku(sku)
    try {
      const formData = new FormData()
      formData.append('sku_code', sku)
      formData.append('current_status', String(currentStatus))
      
      await toggleProductStatus(formData)
      
      setProducts(prev => prev.map(p => {
        if (p.sku_code === sku) {
          return { ...p, is_active: !currentStatus }
        }
        return p
      }))
    } catch (err) {
      console.error("Gagal mengubah status aktif:", err)
    } finally {
      setLoadingSku(null)
    }
  }

  return (
    <Card className="glass-card border-none overflow-hidden">
      <CardHeader className="bg-primary/5 py-4 px-6 border-b border-border/50">
        <CardTitle className="text-xl">Products & Markup</CardTitle>
        <CardDescription>Manage your product catalog and set selling prices.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px] pl-4 py-2 text-xs">SKU</TableHead>
                <TableHead className="py-2 text-xs">Product</TableHead>
                <TableHead className="py-2 text-xs">Brand</TableHead>
                <TableHead className="whitespace-nowrap py-2 text-xs">Modal (Rp)</TableHead>
                <TableHead className="whitespace-nowrap py-2 text-xs w-[180px]">Jual (Rp)</TableHead>
                <TableHead className="whitespace-nowrap py-2 text-xs">Profit/Unit</TableHead>
                <TableHead className="text-center py-2 text-xs">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const currentEditValue = editedPrices[product.sku_code]
                const isEdited = currentEditValue !== undefined && currentEditValue !== String(product.harga_jual)
                const priceToShow = currentEditValue !== undefined ? currentEditValue : String(product.harga_jual)
                
                const currentPriceVal = parseFloat(priceToShow) || 0
                const profit = currentPriceVal - product.harga_modal

                return (
                  <TableRow key={product.sku_code} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="pl-4 py-2 font-mono text-xs text-muted-foreground">{product.sku_code}</TableCell>
                    <TableCell className="py-2">
                      <div className="font-semibold text-xs md:text-sm text-foreground">{product.product_name}</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">{product.category}</div>
                    </TableCell>
                    <TableCell className="text-xs py-2">{product.brand}</TableCell>
                    <TableCell className="font-mono text-xs py-2">Rp {Number(product.harga_modal).toLocaleString('id-ID')}</TableCell>
                    
                    {/* Active price input field */}
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] md:text-xs text-muted-foreground font-mono">Rp</span>
                        <Input
                          type="number"
                          value={priceToShow}
                          onChange={(e) => handlePriceChange(product.sku_code, e.target.value)}
                          className="w-20 md:w-24 h-7 md:h-8 px-2 py-1 text-xs font-mono font-bold text-right border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-primary rounded-md"
                        />
                        {loadingSku === product.sku_code ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : isEdited ? (
                          <button
                            onClick={() => handleSave(product.sku_code)}
                            className="p-1 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors cursor-pointer shadow-sm flex items-center justify-center"
                            title="Simpan Harga"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className={`font-mono text-xs py-2 font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {profit >= 0 ? '+' : ''}Rp {profit.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <button
                        onClick={() => handleToggleActive(product.sku_code, product.is_active)}
                        className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 ${product.is_active ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'}`}
                      >
                        {product.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12 text-xs">
                    No products found for this category. Click Sync to fetch from DigiFlazz.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
