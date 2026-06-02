import { createClient } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/DashboardSidebar'
import { SidebarWrapper } from '@/components/SidebarWrapper'
import { Suspense } from 'react'
import { RealtimeListener } from '@/components/RealtimeListener'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, nama_toko, email')
    .eq('id', user.id)
    .single()

  // Only superadmin and admin can access admin panel
  if (!userData?.role || !['superadmin', 'admin'].includes(userData.role)) {
    redirect('/staff')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 relative overflow-hidden">
      <RealtimeListener userId={user.id} role={userData.role} />
      {/* Background decorations */}
      <div className="fixed inset-0 bg-grid-slate-200 dark:bg-grid-zinc-800 opacity-50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-96 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-96 bg-gradient-to-tr from-blue-500/10 via-teal-500/5 to-transparent blur-3xl -z-10 pointer-events-none" />

      <Suspense fallback={
        <Sidebar
          userRole={userData.role}
          balance={0}
          storeName={userData.role === 'superadmin' ? 'Super Admin' : 'Admin Panel'}
          email={user.email || undefined}
        />
      }>
        <SidebarWrapper
          userRole={userData.role}
          storeName={userData.role === 'superadmin' ? 'Super Admin' : 'Admin Panel'}
          email={user.email || undefined}
        />
      </Suspense>

      <main className="pl-[260px] transition-all duration-300 relative z-10">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
