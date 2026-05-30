import { createClient } from '@/infrastructure/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MitraStatusBadge } from '@/components/MitraStatusBadge'
import { MitraTopUpButton } from '@/components/MitraTopUpButton'
import { CreateStaffDialog } from '@/components/CreateStaffDialog'

interface SearchParams {
  search?: string
  status?: string
}

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const sp = await searchParams
  const currentSearch = sp?.search || ''
  const currentStatus = sp?.status || 'all'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let query = supabase
    .from('users')
    .select('*')
    .eq('role', 'staff')
    .order('created_at', { ascending: false })

  if (currentStatus && currentStatus !== 'all') {
    if (currentStatus === 'active') {
      query = query.gt('saldo', 0)
    } else if (currentStatus === 'inactive') {
      query = query.eq('saldo', 0)
    }
  }

  if (currentSearch) {
    query = query.or(`email.ilike.%${currentSearch}%,nama_toko.ilike.%${currentSearch}%`)
  }

  const { data: staffMembers } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kelola Staff</h2>
          <p className="text-sm text-muted-foreground">
            {staffMembers?.length || 0} staff terdaftar
          </p>
        </div>
        <CreateStaffDialog />
      </div>

      <Card className="glass-card border-none">
        <CardContent className="p-4">
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Cari</Label>
              <Input
                id="search"
                name="search"
                placeholder="Cari email atau nama toko..."
                defaultValue={currentSearch}
                className="border-primary/20"
              />
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="status" className="sr-only">Status</Label>
              <select
                name="status"
                defaultValue={currentStatus}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif (Saldo {'>'} 0)</option>
                <option value="inactive">Nonaktif (Saldo = 0)</option>
              </select>
            </div>
            <Button type="submit" size="sm" className="h-8">Filter</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card border-none overflow-hidden">
        <CardHeader className="bg-primary/5 pb-4 border-b border-border/50">
          <CardTitle className="text-lg">Daftar Staff</CardTitle>
          <CardDescription>Kelola dan lihat detail staff terdaftar.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Staff</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nama Toko</TableHead>
                  <TableHead className="text-center">Saldo</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center pr-4">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers?.map((staff) => (
                  <TableRow key={staff.id} className="hover:bg-primary/5 transition-colors group">
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {staff.email?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div className="text-sm font-medium">
                          {staff.email?.split('@')[0] || 'User'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {staff.email}
                    </TableCell>
                    <TableCell>
                      {staff.nama_toko ? (
                        <Badge variant="outline" className="bg-white/50 dark:bg-black/20">
                          {staff.nama_toko}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Belum diatur</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${staff.saldo > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        Rp {Number(staff.saldo).toLocaleString('id-ID')}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <MitraStatusBadge saldo={Number(staff.saldo)} />
                    </TableCell>
                    <TableCell className="text-center pr-4">
                      <div className="flex items-center justify-center gap-2">
                        <MitraTopUpButton userId={staff.id} email={staff.email} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!staffMembers || staffMembers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      Tidak ada staff ditemukan.
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