import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '../NotificationBell'
import {
  LayoutDashboard, Users, Factory, ShoppingCart,
  AlertCircle, BarChart2, Settings, LogOut, Shield,
  ChevronRight, Menu, X, CreditCard, Megaphone,
  ClipboardCheck,
} from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',      to: '/admin/dashboard' },
  { icon: Factory,         label: 'Manufacturers',  to: '/admin/manufacturers' },
  { icon: ClipboardCheck,  label: 'Verification',   to: '/admin/verification' },
  { icon: Users,           label: 'Buyers',         to: '/admin/buyers' },
  { icon: ShoppingCart,    label: 'Orders',         to: '/admin/orders' },
  { icon: AlertCircle,     label: 'Complaints',     to: '/admin/complaints' },
  { icon: CreditCard,      label: 'Payments',       to: '/admin/payments' },
  { icon: BarChart2,       label: 'Analytics',      to: '/admin/analytics' },
  { icon: Megaphone,       label: 'Content',        to: '/admin/content' },
  { icon: Settings,        label: 'Settings',       to: '/admin/settings' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="flex h-screen overflow-hidden bg-sp-bg">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 flex-shrink-0 bg-white border-r border-sp-border flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-sp-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gradient-card-purple rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sp-text text-sm">Admin Portal</p>
              <p className="text-[10px] text-sp-muted tracking-wide">B2BHarat Platform</p>
            </div>
          </div>
          <button className="lg:hidden p-1 text-sp-muted" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-sp-purple-pale text-sp-purple font-semibold'
                    : 'text-sp-muted hover:bg-sp-bg hover:text-sp-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sp-purple' : ''}`} />
                  {item.label}
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto text-sp-purple/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-sp-border space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sp-bg">
            <div className="w-8 h-8 gradient-card-purple rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0] ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sp-text truncate">{user?.name ?? 'Admin'}</p>
              <p className="text-xs text-sp-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-sp-muted hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-sp-border px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            className="lg:hidden p-2 rounded-xl text-sp-muted hover:bg-sp-bg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-5 w-px bg-sp-border mx-1 hidden sm:block" />
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-sp-mint text-sp-success rounded-lg">
              System Admin
            </span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
