import { createClient } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/DashboardSidebar'
import { RealtimeListener } from '@/components/RealtimeListener'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, nama_toko, email, saldo')
    .eq('id', user.id)
    .single()

  // Redirect admin and superadmin to their own dashboards
  if (userData?.role === 'admin') {
    redirect('/admin')
  }
  if (userData?.role === 'superadmin') {
    redirect('/superadmin')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 relative overflow-hidden">
      <RealtimeListener userId={user.id} role={userData?.role} />
      {/* Background decorations */}
      <div className="fixed inset-0 bg-grid-slate-200 dark:bg-grid-zinc-800 opacity-50 pointer-events-none" />
      <div className="absolute top-0 left-1/2 w-1/2 h-96 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/2 w-1/2 h-96 bg-gradient-to-tl from-teal-500/10 via-cyan-500/5 to-transparent blur-3xl -z-10 pointer-events-none" />

      <Sidebar
        userRole="staff"
        balance={userData?.saldo || 0}
        storeName={userData?.nama_toko || 'Toko Saya'}
        email={user.email || undefined}
      />

      <main className="pl-[260px] transition-all duration-300 relative z-10">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
