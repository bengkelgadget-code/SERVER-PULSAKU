import { createClient } from '@/infrastructure/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Shield, Package, ArrowLeftRight } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function SuperAdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'superadmin') {
    redirect('/admin')
  }

  // Get statistics
  const [{ count: totalUsers }, { count: totalProducts }, { count: totalTransactions }] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
  ])

  const { data: roleStats } = await supabase
    .from('users')
    .select('role')

  const roleCounts = roleStats?.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Super Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Selamat datang, {user.email}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total User</p>
                <p className="text-xl font-bold">{totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Super Admin</p>
                <p className="text-xl font-bold text-red-600">{roleCounts.superadmin || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Admin</p>
                <p className="text-xl font-bold text-purple-600">{roleCounts.admin || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Staff</p>
                <p className="text-xl font-bold">{roleCounts.staff || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Manajemen User
            </CardTitle>
            <CardDescription>Kelola semua user dan role</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/superadmin/users">
              <Button className="w-full">Kelola User</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Katalog Produk
            </CardTitle>
            <CardDescription>Kelola produk dan harga</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin">
              <Button className="w-full" variant="outline">Lihat Produk</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              Riwayat Transaksi
            </CardTitle>
            <CardDescription>Lihat semua transaksi</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/transactions">
              <Button className="w-full" variant="outline">Lihat Transaksi</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Database Stats */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Statistik Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">{totalUsers || 0}</p>
              <p className="text-sm text-muted-foreground">Total User</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">{totalProducts || 0}</p>
              <p className="text-sm text-muted-foreground">Total Produk</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">{totalTransactions || 0}</p>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">{roleCounts.staff || 0}</p>
              <p className="text-sm text-muted-foreground">Staff</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}