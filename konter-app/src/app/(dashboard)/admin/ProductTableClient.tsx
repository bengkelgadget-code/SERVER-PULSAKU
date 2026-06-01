'use client'

import { useState, useEffect, useRef } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Check, Loader2 } from 'lucide-react'
import { updateProductPriceClient, toggleProductStatus } from './actions'

interface ProductTableClientProps {
  initialProducts: any[]
}

export function ProductTableClient({ initialProducts }: ProductTableClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({})
  const [loadingSku, setLoadingSku] = useState<string | null>(null)
  const [savedSkus, setSavedSkus] = useState<Record<string, boolean>>({})
  
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({})

  const prevSkusRef = useRef<string>('')

  // Sync state when initialProducts prop changes due to filter updates (SKU list change)
  useEffect(() => {
    const currentSkus = initialProducts.map(p => p.sku_code).join(',')
    if (currentSkus !== prevSkusRef.current) {
      setProducts(initialProducts)
      setEditedPrices({})
      prevSkusRef.current = currentSkus
    }
  }, [initialProducts])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout)
    }
  }, [])

  // Helper to format numeric string to thousands separators (id-ID)
  const toRupiahString = (num: number | string) => {
    const clean = String(num).replace(/\D/g, '')
    if (!clean) return ''
    return Number(clean).toLocaleString('id-ID')
  }

  const handlePriceChange = (sku: string, value: string) => {
    const clean = value.replace(/\D/g, '')
    const formatted = clean ? Number(clean).toLocaleString('id-ID') : ''
    
    setEditedPrices(prev => ({
      ...prev,
      [sku]: formatted
    }))

    // Clear existing timeout for this SKU
    if (timeoutRefs.current[sku]) {
      clearTimeout(timeoutRefs.current[sku])
    }

    // Set new timeout for autosave after 1.5 seconds (1500ms) of inactivity
    timeoutRefs.current[sku] = setTimeout(() => {
      const originalPrice = String(products.find(p => p.sku_code === sku)?.harga_jual)
      if (clean && clean !== originalPrice) {
        handleSave(sku, formatted)
      }
    }, 1500)
  }

  const handleSave = async (sku: string, formattedValue?: string) => {
    // Get latest edit value from parameter or state
    const value = formattedValue !== undefined ? formattedValue : editedPrices[sku]
    if (value === undefined) return

    const cleanPrice = value.replace(/\D/g, '')
    if (!cleanPrice) return

    // Clear any pending timeouts for this SKU
    if (timeoutRefs.current[sku]) {
      clearTimeout(timeoutRefs.current[sku])
      delete timeoutRefs.current[sku]
    }

    setLoadingSku(sku)
    try {
      const formData = new FormData()
      formData.append('sku_code', sku)
      formData.append('harga_jual', cleanPrice)
      
      const res = await updateProductPriceClient(formData)
      if (!res.success) {
        throw new Error(res.error || 'Gagal menyimpan harga')
      }
      
      // Update local state value
      setProducts(prev => prev.map(p => {
        if (p.sku_code === sku) {
          return { ...p, harga_jual: parseFloat(cleanPrice) }
        }
        return p
      }))
      
      // Clear edited state for this SKU
      setEditedPrices(prev => {
        const next = { ...prev }
        delete next[sku]
        return next
      })

      // Show temporary green checkmark to indicate successful save
      setSavedSkus(prev => ({ ...prev, [sku]: true }))
      setTimeout(() => {
        setSavedSkus(prev => {
          const next = { ...prev }
          delete next[sku]
          return next
        })
      }, 2000)

    } catch (err) {
      console.error("Gagal menyimpan harga:", err)
      alert("Gagal menyimpan harga: " + (err as Error).message)
    } finally {
      setLoadingSku(null)
    }
  }

  const handleBlur = (sku: string) => {
    const currentEditValue = editedPrices[sku]
    if (currentEditValue !== undefined) {
      const cleanPrice = currentEditValue.replace(/\D/g, '')
      const originalPrice = String(products.find(p => p.sku_code === sku)?.harga_jual)
      if (cleanPrice && cleanPrice !== originalPrice) {
        handleSave(sku, currentEditValue)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, sku: string) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur() // Triggers handleBlur which saves
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
      alert("Gagal mengubah status aktif: " + (err as Error).message)
    } finally {
      setLoadingSku(null)
    }
  }

  return (
    <Card className="glass-card border-none overflow-hidden">
      <CardHeader className="bg-primary/5 py-3 px-6 border-b border-border/50">
        <CardTitle className="text-xl">Products & Markup</CardTitle>
        <CardDescription>Manage your product catalog and set selling prices.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[calc(100vh-270px)]">
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
                const priceToShow = currentEditValue !== undefined ? currentEditValue : toRupiahString(product.harga_jual)
                
                const currentPriceVal = parseFloat(priceToShow.replace(/\D/g, '')) || 0
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
                    
                    {/* Active price input field formatted as Rupiah string with same fonts */}
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1 font-mono text-xs border border-zinc-200/60 dark:border-zinc-800/60 rounded px-2 py-0.5 bg-white dark:bg-zinc-950 max-w-[140px] focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                        <span className="text-muted-foreground">Rp</span>
                        <input
                          type="text"
                          value={priceToShow}
                          onChange={(e) => handlePriceChange(product.sku_code, e.target.value)}
                          onBlur={() => handleBlur(product.sku_code)}
                          onKeyDown={(e) => handleKeyDown(e, product.sku_code)}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none font-mono text-xs font-bold text-left h-5"
                          placeholder="0"
                        />
                        {loadingSku === product.sku_code ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
                        ) : savedSkus[product.sku_code] ? (
                          <Check className="w-3.5 h-3.5 text-green-500 shrink-0 animate-bounce" />
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
