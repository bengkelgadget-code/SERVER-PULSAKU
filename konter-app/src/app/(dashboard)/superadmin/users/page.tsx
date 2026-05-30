import { createClient } from '@/infrastructure/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RoleBadge } from '@/components/RoleBadge'
import { UserActions } from '@/components/UserActions'
import { MitraTopUpButton } from '@/components/MitraTopUpButton'
import { redirect } from 'next/navigation'

interface SearchParams {
  search?: string
  role?: string
}

export default async function SuperAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (caller?.role !== 'superadmin') {
    redirect('/admin')
  }

  const sp = await searchParams
  const currentSearch = sp?.search || ''
  const currentRole = sp?.role || 'all'

  let query = supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (currentRole && currentRole !== 'all') {
    query = query.eq('role', currentRole)
  }

  if (currentSearch) {
    query = query.or(`email.ilike.%${currentSearch}%,nama_toko.ilike.%${currentSearch}%`)
  }

  const { data: users } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen User</h2>
          <p className="text-sm text-muted-foreground">
            {users?.length || 0} user terdaftar
          </p>
        </div>
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
              <Label htmlFor="role" className="sr-only">Role</Label>
              <select
                name="role"
                defaultValue={currentRole}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">Semua Role</option>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <Button type="submit" size="sm" className="h-8">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card border-none overflow-hidden">
        <CardHeader className="bg-primary/5 pb-4 border-b border-border/50">
          <CardTitle className="text-lg">Daftar User</CardTitle>
          <CardDescription>Kelola role dan akses user.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nama Toko</TableHead>
                  <TableHead className="text-center">Saldo</TableHead>
                  <TableHead className="text-center">Role</TableHead>
                  <TableHead className="text-center pr-4">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id} className="hover:bg-primary/5 transition-colors group">
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {u.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="text-sm font-medium">
                          {u.email?.split('@')[0] || 'User'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      {u.nama_toko ? (
                        <Badge variant="outline" className="bg-white/50 dark:bg-black/20">
                          {u.nama_toko}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">
                        Rp {Number(u.saldo).toLocaleString('id-ID')}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell className="text-center pr-4">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <MitraTopUpButton userId={u.id} email={u.email} namaToko={u.nama_toko || undefined} />
                        <UserActions
                          userId={u.id}
                          currentRole={u.role}
                          isSelf={u.id === user.id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!users || users.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      Tidak ada user ditemukan.
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