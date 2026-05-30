import { Sidebar } from './DashboardSidebar'
import { digiflazz } from '@/infrastructure/digiflazz/client'

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
      balance={digiflazzBalance}
      storeName={storeName}
      email={email}
    />
  )
}
