import { createClient } from '@/infrastructure/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function StaffHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null;

  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      products ( product_name, brand, category )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-zinc-950/95 backdrop-blur-sm pb-4 -mx-6 px-6 border-b border-transparent">
        <h2 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h2>
        <p className="text-sm text-muted-foreground">{transactions?.length || 0} transaksi tercatat</p>
      </div>

      {/* Table - Scrollable */}
      <Card className="glass-card border-none overflow-hidden">
        <CardHeader className="bg-primary/5 pb-6 border-b border-border/50">
          <CardTitle className="text-xl">Transaksi Anda</CardTitle>
          <CardDescription>Daftar pembelian yang telah dilakukan.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-280px)]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>No. Tujuan</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SN / Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((trx) => (
                  <TableRow key={trx.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell>{new Date(trx.created_at).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <div className="font-medium">{trx.products?.product_name || trx.sku_code}</div>
                      <div className="text-xs text-muted-foreground">{trx.products?.brand}</div>
                    </TableCell>
                    <TableCell>{trx.customer_no}</TableCell>
                    <TableCell>Rp {trx.harga_jual.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge variant={
                        trx.status === 'sukses' ? 'default' :
                        trx.status === 'gagal' ? 'destructive' : 'secondary'
                      } className={trx.status === 'sukses' ? 'bg-green-500' : ''}>
                        {trx.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{trx.sn || '-'}</TableCell>
                  </TableRow>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      Belum ada transaksi.
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