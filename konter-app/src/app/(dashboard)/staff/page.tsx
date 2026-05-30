import { createClient } from '@/infrastructure/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { buyProduct } from './actions'
import { ProductFilters } from '@/components/ProductFilters'
import { ArrowLeftRight, TrendingUp, CheckCircle, XCircle } from 'lucide-react'

export default async function StaffCatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const sp = await searchParams
  const currentCategory = sp?.category as string | undefined
  const currentBrand = sp?.brand as string | undefined

  // Fetch user data for dashboard
  const { data: userData } = await supabase
    .from('users')
    .select('saldo, nama_toko')
    .eq('id', user?.id)
    .single()

  // Fetch transaction stats
  const { count: totalTx } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  const { count: successTx } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('status', 'sukses')

  const { count: failedTx } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('status', 'gagal')

  // Fetch unique categories
  const { data: categoriesData } = await supabase
    .from('products')
    .select('category')
    .eq('is_active', true)

  const categories = Array.from(new Set(categoriesData?.map(c => c.category) || [])).sort()

  // Fetch unique brands based on category
  let brandQuery = supabase.from('products').select('brand').eq('is_active', true)
  if (currentCategory) brandQuery = brandQuery.eq('category', currentCategory)
  const { data: brandsData } = await brandQuery
  const brands = Array.from(new Set(brandsData?.map(b => b.brand) || [])).sort()

  // Fetch products
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
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
      {/* ── Balance & Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-green-500/20 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className="text-xl font-bold text-green-600">
                  Rp {Number(userData?.saldo || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Transaksi</p>
                <p className="text-xl font-bold">{totalTx || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-500/20 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Berhasil</p>
                <p className="text-xl font-bold text-green-600">{successTx || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gagal</p>
                <p className="text-xl font-bold text-red-600">{failedTx || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Katalog Produk</h2>
      </div>

      <ProductFilters categories={categories} brands={brands} basePath="/staff" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products?.map((product) => (
          <Card key={product.sku_code} className="glass-card flex flex-col group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border-t-4 border-t-primary/50 overflow-hidden">
            <CardHeader className="pb-4 relative bg-gradient-to-b from-primary/5 to-transparent">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="bg-white/50 dark:bg-black/20 backdrop-blur-sm shadow-sm">{product.category}</Badge>
                <Badge variant="secondary" className="font-mono text-xs">{product.brand}</Badge>
              </div>
              <CardTitle className="text-lg leading-tight font-bold group-hover:text-primary transition-colors">{product.product_name}</CardTitle>
              <CardDescription className="line-clamp-2 text-xs opacity-80 mt-1">{product.desc || 'Tidak ada deskripsi'}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end pt-0">
              <div className="bg-zinc-100/50 dark:bg-zinc-800/50 p-4 rounded-xl mb-4 border border-zinc-200/50 dark:border-zinc-700/50">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Harga</p>
                <p className="text-2xl font-black text-gradient">
                  Rp {product.harga_jual.toLocaleString('id-ID')}
                </p>
              </div>
            </CardContent>
            <div className="p-4 pt-0 mt-auto border-t border-zinc-100/50 dark:border-zinc-800/50 bg-white/30 dark:bg-black/10">
              <form action={buyProduct} className="space-y-4 pt-4">
                <input type="hidden" name="sku_code" value={product.sku_code} />
                <div className="space-y-2">
                  <Label htmlFor={`customer_no_${product.sku_code}`} className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Nomor Tujuan
                  </Label>
                  <Input 
                    id={`customer_no_${product.sku_code}`}
                    name="customer_no" 
                    placeholder="Contoh: 081234567890" 
                    required 
                    className="border-primary/20 focus-visible:ring-primary/50"
                  />
                </div>
                <Button type="submit" className="w-full font-bold shadow-md hover:shadow-lg transition-all rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90" size="lg">
                  Beli Sekarang
                </Button>
              </form>
            </div>
          </Card>
        ))}

        {(!products || products.length === 0) && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed">
            Belum ada produk yang aktif. Hubungi Admin.
          </div>
        )}
      </div>
    </div>
  )
}