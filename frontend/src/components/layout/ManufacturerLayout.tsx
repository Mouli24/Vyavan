import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '../NotificationBell'
import {
  LayoutDashboard,
  Store,
  Truck,
  MessageSquare,
  CreditCard,
  AlertCircle,
  Settings,
  HelpCircle,
  Zap,
  LogOut,
  ClipboardList,
  ShoppingCart,
  Boxes,
  CalendarClock,
  CalendarDays,
  Menu,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview',       to: '/manufacturer/overview' },
  { icon: Store,           label: 'My Store',       to: '/manufacturer/store' },
  { icon: ShoppingCart,    label: 'Orders',         to: '/manufacturer/orders' },
  { icon: Boxes,           label: 'Inventory',      to: '/manufacturer/inventory' },
  { icon: Truck,           label: 'Shipment',       to: '/manufacturer/shipment' },
  { icon: MessageSquare,   label: 'Negotiation',    to: '/manufacturer/negotiation' },
  { icon: CreditCard,      label: 'Payment',        to: '/manufacturer/payment' },
  { icon: AlertCircle,     label: 'Complaints',     to: '/manufacturer/complaints' },
  { icon: CalendarClock,   label: 'Scheduled Calls',to: '/manufacturer/scheduled-calls' },
  { icon: CalendarDays,    label: 'Holiday & Availability', to: '/manufacturer/holidays' },
  { icon: ClipboardList,   label: 'Onboarding',     to: '/manufacturer/onboarding' },
]

export default function ManufacturerLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="mb-6 px-2 flex items-center gap-3">
        <div className="w-9 h-9 gradient-card-purple rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
          <LayoutDashboard size={18} className="text-white" />
        </div>
        <Link to="/manufacturer" className="flex-1 min-w-0" onClick={() => setSidebarOpen(false)}>
          <h1 className="font-semibold text-sm leading-tight text-mfr-dark truncate">{user?.company ?? 'Manufacturer'}</h1>
          <p className="text-[10px] uppercase tracking-widest text-mfr-muted font-medium mt-0.5">Atelier Hub</p>
        </Link>
        {/* Close button on mobile */}
        <button className="lg:hidden p-1 text-mfr-muted" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-mfr-peach text-mfr-dark font-semibold'
                  : 'text-mfr-muted hover:bg-mfr-peach/50 hover:text-mfr-dark'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade card */}
      <div className="mt-4 bg-mfr-peach/70 border border-mfr-border rounded-xl p-4 relative overflow-hidden mb-3">
        <Zap className="text-mfr-brown mb-2" size={16} />
        <h4 className="text-[11px] font-semibold text-mfr-brown mb-2">Upgrade to Pro</h4>
        <p className="text-[10px] text-mfr-muted mb-3 leading-relaxed">Get advanced analytics &amp; AI features.</p>
        <button className="w-full bg-mfr-brown text-white rounded-lg text-[11px] font-semibold h-8 hover:bg-mfr-brown-hover transition-colors">
          Upgrade Now
        </button>
      </div>

      {/* Bottom items */}
      <div className="space-y-0.5 pt-2 border-t border-mfr-border">
        <NavLink
          to="/manufacturer/settings"
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${isActive ? 'bg-mfr-peach text-mfr-dark font-semibold' : 'text-mfr-muted hover:bg-mfr-peach/50 hover:text-mfr-dark'}`}
        >
          <Settings size={16} /> Settings
        </NavLink>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-mfr-muted hover:bg-mfr-peach/50 hover:text-mfr-dark transition-all">
          <HelpCircle size={16} /> Help Center
        </button>
        <button
          onClick={() => { logout(); navigate('/') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-mfr-muted hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-white">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar — desktop always visible, mobile slide-in ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 flex-shrink-0 flex flex-col py-6 px-4
        bg-mfr-sidebar border-r border-mfr-border
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Shared topbar */}
        <div className="flex-shrink-0 h-14 bg-white border-b border-mfr-border flex items-center justify-between px-4 lg:px-8 gap-3">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden p-2 rounded-xl text-mfr-muted hover:bg-mfr-peach/40 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <NotificationBell />
        </div>
        <main className="flex-1 overflow-y-auto bg-sp-bg/20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
