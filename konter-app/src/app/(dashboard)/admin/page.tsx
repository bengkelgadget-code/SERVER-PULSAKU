import { createClient } from '@/infrastructure/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { syncProductsAction } from './actions'
import { ProductFilters } from '@/components/ProductFilters'

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const supabase = await createClient()
  const sp = await searchParams
  const currentCategory = sp?.category as string | undefined
  const currentBrand = sp?.brand as string | undefined

  // Fetch unique categories
  const { data: categoriesData } = await supabase
    .from('products')
    .select('category')

  const categories = Array.from(new Set(categoriesData?.map(c => c.category) || [])).sort()

  // Fetch unique brands based on category
  let brandQuery = supabase.from('products').select('brand')
  if (currentCategory) brandQuery = brandQuery.eq('category', currentCategory)
  const { data: brandsData } = await brandQuery
  const brands = Array.from(new Set(brandsData?.map(b => b.brand) || [])).sort()

  let query = supabase
    .from('products')
    .select('*')
    .order('brand', { ascending: true })
    .order('harga_jual', { ascending: true })

  if (currentCategory) {
    query = query.eq('category', currentCategory)
  }
  if (currentBrand) {
    query = query.eq('brand', currentBrand)
  }

  if (!currentCategory) {
    query = query.order('category', { ascending: true })
  }

  const { data: products } = await query

  return (
    <div className="space-y-6">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-zinc-950/95 backdrop-blur-sm pb-4 -mx-6 px-6 border-b border-transparent">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Product Catalog</h2>
            <p className="text-sm text-muted-foreground">{products?.length || 0} produk terdaftar</p>
          </div>
          <form action={syncProductsAction}>
            <Button type="submit" className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync DigiFlazz
            </Button>
          </form>
        </div>

        <ProductFilters categories={categories} brands={brands} basePath="/admin" />
      </div>

      {/* Table - Scrollable */}
      <Card className="glass-card border-none overflow-hidden">
        <CardHeader className="bg-primary/5 pb-6 border-b border-border/50">
          <CardTitle className="text-xl">Products & Markup</CardTitle>
          <CardDescription>Manage your product catalog and set selling prices.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px] pl-4">SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="whitespace-nowrap">Modal (Rp)</TableHead>
                  <TableHead className="whitespace-nowrap">Jual (Rp)</TableHead>
                  <TableHead className="whitespace-nowrap">Profit/Unit</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-center pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {products?.map((product: any) => {
                  const profit = product.harga_jual - product.harga_modal
                  return (
                    <TableRow key={product.sku_code} className="hover:bg-primary/5 transition-colors">
                      <TableCell className="pl-4 font-mono text-xs text-muted-foreground">{product.sku_code}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{product.product_name}</div>
                        <div className="text-xs text-muted-foreground">{product.category}</div>
                      </TableCell>
                      <TableCell className="text-sm">{product.brand}</TableCell>
                      <TableCell className="font-mono text-xs">Rp {Number(product.harga_modal).toLocaleString('id-ID')}</TableCell>
                      <TableCell className="font-mono text-xs font-bold">Rp {Number(product.harga_jual).toLocaleString('id-ID')}</TableCell>
                      <TableCell className="font-mono text-xs text-green-600 font-medium">+Rp {profit.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.is_active ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4"></TableCell>
                    </TableRow>
                  )
                })}
                {(!products || products.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      No products found for this category. Click Sync to fetch from DigiFlazz.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}