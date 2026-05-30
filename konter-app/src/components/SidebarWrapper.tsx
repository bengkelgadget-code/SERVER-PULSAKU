import { Sidebar } from './DashboardSidebar'
import { digiflazz } from '@/infrastructure/digiflazz/client'
import { createClient } from '@/infrastructure/supabase/server'

export async function SidebarWrapper({ 
  userRole, 
  storeName, 
  email 
}: { 
  userRole: 'superadmin' | 'admin' | 'staff',
  storeName?: string,
  email?: string 
}) {
  let digiflazzBalance = 0
  let userBalance = 0
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: userData } = await supabase.from('users').select('saldo').eq('id', user.id).single()
    if (userData) userBalance = Number(userData.saldo)
  }

  // Hanya fetch saldo digiflazz jika role adalah admin/superadmin
  if (userRole === 'superadmin' || userRole === 'admin') {
    try {
      digiflazzBalance = await digiflazz.getBalance()
    } catch (error) {
      console.error("Failed to fetch Digiflazz balance", error)
    }
  }

  return (
    <Sidebar
      userRole={userRole}
      balance={userBalance}
      digiflazzBalance={userRole === 'superadmin' || userRole === 'admin' ? digiflazzBalance : undefined}
      storeName={storeName}
      email={email}
    />
  )
}
