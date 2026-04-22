import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '../NotificationBell'
import { VyawanIcon } from '../VyawanLogo'
import {
  LayoutDashboard, Users, Factory, ShoppingCart,
  AlertCircle, BarChart2, Settings, LogOut, Shield,
  Menu, X, CreditCard, Megaphone, ClipboardCheck,
  ChevronRight,
} from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     to: '/admin/dashboard' },
  { icon: Factory,         label: 'Manufacturers', to: '/admin/manufacturers' },
  { icon: ClipboardCheck,  label: 'Verification',  to: '/admin/verification' },
  { icon: Users,           label: 'Buyers',        to: '/admin/buyers' },
  { icon: ShoppingCart,    label: 'Orders',        to: '/admin/orders' },
  { icon: AlertCircle,     label: 'Complaints',    to: '/admin/complaints' },
  { icon: CreditCard,      label: 'Payments',      to: '/admin/payments' },
  { icon: BarChart2,       label: 'Analytics',     to: '/admin/analytics' },
  { icon: Megaphone,       label: 'Content',       to: '/admin/content' },
  { icon: Settings,        label: 'Settings',      to: '/admin/settings' },
]

// Warm brown theme tokens
const S = {
  bg:         '#F5F2ED',
  border:     '#E5E1DA',
  brown:      '#5D4037',
  brownHover: '#4E342E',
  peach:      '#FCE7D6',
  muted:      '#A89F91',
  dark:       '#1A1A1A',
  activeBg:   '#FCE7D6',
  activeText: '#3E2723',
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: S.bg, borderRight: `1px solid ${S.border}` }}>
      {/* Logo */}
      <div className="px-4 py-5 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: `1px solid ${S.border}` }}>
        <div className="flex items-center gap-3">
          <VyawanIcon size={32} />
          <div>
            <p className="text-sm font-black tracking-tight" style={{ color: S.dark }}>Vyawan</p>
            <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: S.muted }}>Admin Portal</p>
          </div>
        </div>
        <button className="lg:hidden p-1 rounded-lg" style={{ color: S.muted }}
          onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                isActive ? '' : ''
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? S.peach : 'transparent',
              color: isActive ? S.activeText : S.muted,
              fontWeight: isActive ? 600 : 500,
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: S.brown, opacity: 0.5 }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${S.border}` }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: 'rgba(93,64,55,0.06)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: S.brown }}>
            {user?.name?.[0] ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: S.dark }}>{user?.name ?? 'Admin'}</p>
            <p className="text-[10px] truncate" style={{ color: S.muted }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
          style={{ color: S.muted }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = '#FEF2F2'
            ;(e.currentTarget as HTMLElement).style.color = '#DC2626'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = S.muted
          }}>
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8F7F5' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-56 flex-shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="flex-shrink-0 sticky top-0 z-10 bg-white px-5 py-3.5 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${S.border}`, boxShadow: '0 1px 0 rgba(0,0,0,0.03)' }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-xl transition-colors"
              style={{ color: S.muted }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = S.peach}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-4 w-px hidden sm:block" style={{ background: S.border }} />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: '#FCE7D6', border: `1px solid #F9D5B8` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: S.brown }} />
              <span className="text-[11px] font-semibold" style={{ color: S.brown }}>System Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
