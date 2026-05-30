import { createClient } from '@/infrastructure/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestDeposit } from './actions'

export default async function StaffDepositPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null;

  const { data: deposits } = await supabase
    .from('deposits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 glass-card border-none overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-primary/20"></div>
          <CardHeader className="relative z-10 pb-6 border-b border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
            <CardTitle className="text-xl font-bold">Isi Saldo</CardTitle>
            <CardDescription>Request deposit ke akun Anda.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form action={requestDeposit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jumlah (Rp)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="e.g. 50000"
                  required
                  min="10000"
                  className="text-lg font-bold border-primary/20 focus-visible:ring-primary/50"
                />
              </div>
              <Button type="submit" className="w-full font-bold shadow-md hover:shadow-lg transition-all rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 py-6" size="lg">
                Request Deposit
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 glass-card border-none overflow-hidden">
          <CardHeader className="bg-primary/5 pb-6 border-b border-border/50">
            <CardTitle className="text-xl">Riwayat Deposit</CardTitle>
            <CardDescription>Riwayat permintaan top up Anda.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Tanggal</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits?.map((deposit) => (
                  <TableRow key={deposit.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="pl-6 text-muted-foreground">{new Date(deposit.created_at).toLocaleString('id-ID')}</TableCell>
                    <TableCell className="font-bold">Rp {deposit.amount.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="pr-6">
                      <Badge variant={
                        deposit.status === 'approved' ? 'default' :
                          deposit.status === 'rejected' ? 'destructive' : 'secondary'
                      } className={deposit.status === 'approved' ? 'bg-green-500/10 text-green-600 border-none shadow-none' : deposit.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-none shadow-none' : 'border-none shadow-none'}>
                        {deposit.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!deposits || deposits.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                      Belum ada riwayat deposit.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
