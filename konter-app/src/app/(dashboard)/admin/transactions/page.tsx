import { createClient } from '@/infrastructure/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function AdminTransactionsPage({ searchParams }: { searchParams: Promise<{ status?: string; from?: string; to?: string; search?: string }> }) {
  const supabase = await createClient()
  const sp = await searchParams
  const statusFilter = sp?.status || ''
  const dateFrom = sp?.from || ''
  const dateTo = sp?.to || ''
  const search = sp?.search || ''

  // Build query with filters
  let query = supabase
    .from('transactions')
    .select(`
      *,
      users ( email, nama_toko ),
      products ( product_name, brand, category )
    `)
    .order('created_at', { ascending: false })

  if (statusFilter && ['pending', 'sukses', 'gagal'].includes(statusFilter)) {
    query = query.eq('status', statusFilter)
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom + 'T00:00:00')
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo + 'T23:59:59')
  }

  const { data: transactions } = await query

  // Client-side search filter (name, email, customer_no, ref_id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = transactions?.filter((trx: any) => {
    if (!search) return true
    const s = search.toLowerCase()
    const userName = trx.users?.nama_toko || ''
    const userEmail = trx.users?.email || ''
    const productName = trx.products?.product_name || ''
    const customerNo = trx.customer_no || ''
    const refId = trx.ref_id || ''
    return (
      userName.toLowerCase().includes(s) ||
      userEmail.toLowerCase().includes(s) ||
      productName.toLowerCase().includes(s) ||
      customerNo.includes(s) ||
      refId.toLowerCase().includes(s)
    )
  })

  // Summary stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalProfit = (filtered?.reduce((sum: number, trx: any) => sum + (Number(trx.harga_jual) - Number(trx.harga_modal)), 0) ?? 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalRevenue = (filtered?.reduce((sum: number, trx: any) => sum + Number(trx.harga_jual), 0) ?? 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-zinc-950/95 backdrop-blur-sm pb-4 -mx-6 px-6 border-b border-transparent">
        <h2 className="text-2xl font-bold tracking-tight">Semua Transaksi</h2>
        <p className="text-sm text-muted-foreground">{filtered?.length || 0} transaksi tercatat</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card border-green-500/20 overflow-hidden">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Revenue</p>
            <p className="text-lg font-black text-green-600">Rp {totalRevenue.toLocaleString('id-ID')}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-emerald-500/20 overflow-hidden">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Profit</p>
            <p className="text-lg font-black text-emerald-600">Rp {totalProfit.toLocaleString('id-ID')}</p>
          </CardContent>
        </Card>
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Jumlah Transaksi</p>
            <p className="text-lg font-black text-primary">{filtered?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-none">
        <CardContent className="p-4">
          <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Cari</Label>
              <Input id="search" name="search" defaultValue={search} placeholder="Nama, email, nomor..." className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs">Status</Label>
              <select
                name="status"
                defaultValue={statusFilter}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="sukses">Sukses</option>
                <option value="gagal">Gagal</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="from" className="text-xs">Dari Tanggal</Label>
              <Input id="from" name="from" type="date" defaultValue={dateFrom} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to" className="text-xs">Sampai Tanggal</Label>
              <Input id="to" name="to" type="date" defaultValue={dateTo} className="text-sm" />
            </div>
            <div className="space-y-1">
              <a href="/admin/transactions" className="inline-flex items-center justify-center h-9 px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-center">
                Reset
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card border-none overflow-hidden">
        <CardHeader className="bg-primary/5 pb-6 border-b border-border/50">
          <CardTitle className="text-xl">Riwayat Transaksi</CardTitle>
          <CardDescription>Semua pembelian dari seluruh Mitra.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-400px)]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Mitra</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Tujuan</TableHead>
                  <TableHead>Modal</TableHead>
                  <TableHead>Jual</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {filtered?.map((trx: any) => (
                  <TableRow key={trx.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="text-xs whitespace-nowrap">{new Date(trx.created_at).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">{trx.users?.nama_toko || '-'}</div>
                      <div className="text-[10px] text-muted-foreground">{trx.users?.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">{trx.products?.product_name || trx.sku_code}</div>
                      <div className="text-[10px] text-muted-foreground">{trx.products?.brand}</div>
                    </TableCell>
                    <TableCell className="text-xs">{trx.customer_no}</TableCell>
                    <TableCell className="text-xs font-mono">Rp {Number(trx.harga_modal).toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-xs font-mono font-bold">Rp {Number(trx.harga_jual).toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-xs font-mono font-medium text-green-600">
                      +Rp {(trx.harga_jual - trx.harga_modal).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={trx.status === 'sukses' ? 'default' : trx.status === 'gagal' ? 'destructive' : 'secondary'}
                        className={trx.status === 'sukses' ? 'bg-green-500 text-[10px]' : 'text-[10px]'}
                      >
                        {trx.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filtered || filtered.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      Tidak ada transaksi ditemukan.
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
