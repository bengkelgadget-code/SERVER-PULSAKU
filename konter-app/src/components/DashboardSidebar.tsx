'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Wallet,
  History,
  LogOut,
  ArrowLeftRight,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { logout } from '@/app/(auth)/actions'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string | number
}

interface SidebarProps {
  userRole: 'superadmin' | 'admin' | 'staff'
  balance?: number
  digiflazzBalance?: number
  storeName?: string
  email?: string
}

export function Sidebar({ userRole, balance = 0, digiflazzBalance, storeName, email }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const adminNavItems: NavItem[] = [
    { href: '/admin', label: 'Katalog Produk', icon: <Package className="w-5 h-5" /> },
    { href: '/admin/deposits', label: 'Deposit Masuk', icon: <Wallet className="w-5 h-5" /> },
    { href: '/admin/transactions', label: 'Semua Transaksi', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { href: '/admin/users', label: 'Kelola Mitra', icon: <Users className="w-5 h-5" /> },
  ]

  const superAdminNavItems: NavItem[] = [
    { href: '/superadmin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/superadmin/users', label: 'Manajemen User', icon: <Users className="w-5 h-5" /> },
    { href: '/admin', label: 'Katalog Produk', icon: <Package className="w-5 h-5" /> },
    { href: '/admin/deposits', label: 'Deposit Masuk', icon: <Wallet className="w-5 h-5" /> },
    { href: '/admin/transactions', label: 'Semua Transaksi', icon: <ArrowLeftRight className="w-5 h-5" /> },
  ]

  const staffNavItems: NavItem[] = [
    { href: '/staff', label: 'Katalog Produk', icon: <Package className="w-5 h-5" /> },
    { href: '/staff/deposit', label: 'Isi Saldo', icon: <Wallet className="w-5 h-5" /> },
    { href: '/staff/history', label: 'Riwayat', icon: <History className="w-5 h-5" /> },
  ]

  const navItems = userRole === 'superadmin' ? superAdminNavItems : userRole === 'admin' ? adminNavItems : staffNavItems

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-40 transition-all duration-300 flex flex-col shadow-xl',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
              {userRole === 'superadmin' ? (
                <Shield className="w-5 h-5 text-white" />
              ) : userRole === 'admin' ? (
                <Shield className="w-5 h-5 text-white" />
              ) : (
                <LayoutDashboard className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                {userRole === 'superadmin' ? 'Super Admin' : userRole === 'admin' ? 'Admin Panel' : 'Staff Panel'}
              </span>
              {storeName && !collapsed && (
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[140px]">
                  {storeName}
                </span>
              )}
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg mx-auto">
            {userRole === 'superadmin' || userRole === 'admin' ? (
              <Shield className="w-5 h-5 text-white" />
            ) : (
              <LayoutDashboard className="w-5 h-5 text-white" />
            )}
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          )}
        </button>
      </div>

      {/* Balance Cards */}
      <div className="px-3 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
        {collapsed ? (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto">
            <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        ) : (
          <>
            {digiflazzBalance !== undefined && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 shadow-lg relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
                <p className="text-[10px] font-semibold text-indigo-100 uppercase tracking-wider mb-1 relative z-10">
                  Saldo Digiflazz
                </p>
                <p className="text-xl font-black text-white relative z-10">
                  Rp {digiflazzBalance.toLocaleString('id-ID')}
                </p>
              </div>
            )}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
              <p className="text-[10px] font-semibold text-green-100 uppercase tracking-wider mb-1 relative z-10">
                {userRole === 'superadmin' || userRole === 'admin' ? 'Saldo Pusat (Lokal)' : 'Saldo Anda'}
              </p>
              <p className="text-xl font-black text-white relative z-10">
                Rp {balance.toLocaleString('id-ID')}
              </p>
              {email && (
                <p className="text-[10px] text-green-100/70 mt-1 truncate relative z-10">{email}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-3">
            Menu {userRole === 'superadmin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : 'Staff'}
          </p>
        )}
        {navItems.map((item) => {
          // Hanya aktif jika persis sama, ATAU jika bukan halaman root (seperti /admin atau /superadmin) dan pathname dimulai dengan href tersebut.
          const isRootPath = item.href === '/admin' || item.href === '/superadmin' || item.href === '/staff'
          const isActive = isRootPath 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(item.href + '/')
            
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className={cn(isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-500 group-hover:text-indigo-500')}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="font-medium text-sm flex-1">{item.label}</span>
                  {item.badge !== undefined && (
                    <Badge
                      variant={isActive ? 'secondary' : 'secondary'}
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full',
                        isActive ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer - Settings & Logout */}
      <div className="px-3 py-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
        {!collapsed && (
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all"
          >
            <Settings className="w-5 h-5 text-zinc-500" />
            <span className="font-medium text-sm">Pengaturan</span>
          </Link>
        )}
        <form action={logout}>
          <button
            type="submit"
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all'
            )}
            title={collapsed ? 'Keluar' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="font-medium text-sm">Keluar</span>}
          </button>
        </form>
      </div>
    </aside>
  )
}
