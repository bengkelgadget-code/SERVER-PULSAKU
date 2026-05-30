import { createClient } from '@/infrastructure/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { processDeposit } from './actions'

export default async function AdminDepositsPage() {
  const supabase = await createClient()

  const { data: deposits } = await supabase
    .from('deposits')
    .select(`
      *,
      users ( email, nama_toko )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-zinc-950/95 backdrop-blur-sm pb-4 -mx-6 px-6 border-b border-transparent">
        <h2 className="text-2xl font-bold tracking-tight text-gradient">Deposit Requests</h2>
        <p className="text-sm text-muted-foreground">{deposits?.length || 0} request tertunda</p>
      </div>

      {/* Table - Scrollable */}
      <Card className="glass-card border-none overflow-hidden">
        <CardHeader className="bg-primary/5 pb-6 border-b border-border/50">
          <CardTitle className="text-xl">Pending & History</CardTitle>
          <CardDescription>Review and process deposit requests from mitras.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-280px)]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Mitra</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits?.map((deposit) => (
                  <TableRow key={deposit.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="pl-6 text-muted-foreground">{new Date(deposit.created_at).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <div className="font-bold">{deposit.users?.nama_toko || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{deposit.users?.email}</div>
                    </TableCell>
                    <TableCell className="font-bold text-gradient">Rp {deposit.amount.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge variant={
                        deposit.status === 'approved' ? 'default' :
                          deposit.status === 'rejected' ? 'destructive' : 'secondary'
                      } className={deposit.status === 'approved' ? 'bg-green-500/10 text-green-600 border-none shadow-none' : deposit.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-none shadow-none' : 'border-none shadow-none'}>
                        {deposit.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {deposit.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <form action={processDeposit}>
                            <input type="hidden" name="deposit_id" value={deposit.id} />
                            <input type="hidden" name="user_id" value={deposit.user_id} />
                            <input type="hidden" name="amount" value={deposit.amount} />
                            <input type="hidden" name="action" value="approve" />
                            <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 font-bold shadow-md">
                              Approve
                            </Button>
                          </form>
                          <form action={processDeposit}>
                            <input type="hidden" name="deposit_id" value={deposit.id} />
                            <input type="hidden" name="user_id" value={deposit.user_id} />
                            <input type="hidden" name="amount" value={deposit.amount} />
                            <input type="hidden" name="action" value="reject" />
                            <Button type="submit" size="sm" variant="destructive" className="rounded-full px-4 font-bold">
                              Reject
                            </Button>
                          </form>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!deposits || deposits.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      No deposit requests found.
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
