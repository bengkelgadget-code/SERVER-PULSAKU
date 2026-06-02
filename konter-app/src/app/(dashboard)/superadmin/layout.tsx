import { createClient } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/DashboardSidebar'
import { SidebarWrapper } from '@/components/SidebarWrapper'
import { Suspense } from 'react'
import { RealtimeListener } from '@/components/RealtimeListener'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single()

  // Only superadmin can access super admin panel
  if (userData?.role !== 'superadmin') {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 relative overflow-hidden">
      <RealtimeListener userId={user.id} role={userData?.role} />
      <div className="fixed inset-0 bg-grid-slate-200 dark:bg-grid-zinc-800 opacity-50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-96 bg-gradient-to-bl from-red-500/10 via-rose-500/5 to-transparent blur-3xl -z-10 pointer-events-none" />

      <Suspense fallback={<Sidebar userRole="superadmin" balance={0} storeName="Super Admin Panel" email={user.email || undefined} />}>
        <SidebarWrapper
          userRole="superadmin"
          storeName="Super Admin Panel"
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