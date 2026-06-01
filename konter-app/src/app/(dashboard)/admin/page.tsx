import { createClient } from '@/infrastructure/supabase/server'
import { Button } from '@/components/ui/button'
import { syncProductsAction } from './actions'
import { ProductFilters } from '@/components/ProductFilters'
import { ProductTableClient } from './ProductTableClient'

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
    <div className="space-y-3">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-zinc-950/95 backdrop-blur-sm pb-1 -mx-6 px-6 border-b border-transparent">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Product Catalog</h2>
            <p className="text-xs text-muted-foreground">{products?.length || 0} produk terdaftar</p>
          </div>
          <form action={syncProductsAction}>
            <Button type="submit" className="gap-2 h-9 px-3 text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync DigiFlazz
            </Button>
          </form>
        </div>

        <ProductFilters categories={categories} brands={brands} basePath="/admin" />
      </div>

      {/* Table Client Component */}
      <ProductTableClient initialProducts={products || []} />
    </div>
  )
}