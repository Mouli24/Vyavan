import { useState } from 'react'
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '../NotificationBell'
import { VerticalDock } from '../Dock'
import {
  LayoutDashboard, Store, Truck, MessageSquare, CreditCard,
  AlertCircle, Settings, HelpCircle, Zap, LogOut, ClipboardList,
  ShoppingCart, Boxes, CalendarClock, CalendarDays, Menu, X, Wallet
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: <LayoutDashboard size={16} />, label: 'Overview',            to: '/manufacturer/overview' },
  { icon: <Store size={16} />,           label: 'My Store',            to: '/manufacturer/store' },
  { icon: <ShoppingCart size={16} />,    label: 'Orders',              to: '/manufacturer/orders' },
  { icon: <Wallet size={16} />,          label: 'Receivables',         to: '/manufacturer/receivables' },
  { icon: <Boxes size={16} />,           label: 'Inventory',           to: '/manufacturer/inventory' },
  { icon: <Truck size={16} />,           label: 'Shipment',            to: '/manufacturer/shipment' },
  { icon: <MessageSquare size={16} />,   label: 'Negotiation',         to: '/manufacturer/negotiation' },
  { icon: <CreditCard size={16} />,      label: 'Payment',             to: '/manufacturer/payment' },
  { icon: <AlertCircle size={16} />,     label: 'Complaints',          to: '/manufacturer/complaints' },
  { icon: <CalendarClock size={16} />,   label: 'Scheduled Calls',     to: '/manufacturer/scheduled-calls' },
  { icon: <CalendarDays size={16} />,    label: 'Holiday & Availability', to: '/manufacturer/holidays' },
  { icon: <ClipboardList size={16} />,   label: 'Onboarding',          to: '/manufacturer/onboarding' },
]

export default function ManufacturerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Build dock items for primary nav
  const navDockItems = NAV_ITEMS.map(item => ({
    icon: item.icon,
    label: item.label,
    onClick: () => { navigate(item.to); setSidebarOpen(false) },
    isActive: location.pathname === item.to,
  }))

  // Bottom dock items
  const bottomDockItems = [
    {
      icon: <Settings size={16} />,
      label: 'General Settings',
      onClick: () => { navigate('/manufacturer/settings'); setSidebarOpen(false) },
      isActive: location.pathname === '/manufacturer/settings',
    },
    {
      icon: <CreditCard size={16} />,
      label: 'Payment Settings',
      onClick: () => { navigate('/manufacturer/settings/payments'); setSidebarOpen(false) },
      isActive: location.pathname === '/manufacturer/settings/payments',
    },
    {
      icon: <HelpCircle size={16} />,
      label: 'Help Center',
      onClick: () => {},
    },
    {
      icon: <LogOut size={16} />,
      label: 'Logout',
      onClick: () => { logout(); navigate('/') },
      className: 'hover:!bg-red-50 hover:!text-red-600',
    },
  ]

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
        <button className="lg:hidden p-1 text-mfr-muted" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
      </div>

      {/* Primary nav — VerticalDock */}
      <div className="flex-1 overflow-y-auto">
        <VerticalDock
          items={navDockItems}
          baseItemSize={36}
          magnification={42}
          distance={100}
          spring={{ mass: 0.1, stiffness: 180, damping: 14 }}
        />
      </div>

      {/* Upgrade card */}
      <div className="mt-4 bg-mfr-peach/70 border border-mfr-border rounded-xl p-4 mb-3">
        <Zap className="text-mfr-brown mb-2" size={16} />
        <h4 className="text-[11px] font-semibold text-mfr-brown mb-2">Upgrade to Pro</h4>
        <p className="text-[10px] text-mfr-muted mb-3 leading-relaxed">Get advanced analytics &amp; AI features.</p>
        <button className="w-full bg-mfr-brown text-white rounded-lg text-[11px] font-semibold h-8 hover:bg-mfr-brown-hover transition-colors">
          Upgrade Now
        </button>
      </div>

      {/* Bottom items — VerticalDock */}
      <div className="pt-2 border-t border-mfr-border">
        <VerticalDock
          items={bottomDockItems}
          baseItemSize={36}
          magnification={42}
          distance={100}
          spring={{ mass: 0.1, stiffness: 180, damping: 14 }}
        />
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-white">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 flex-shrink-0 flex flex-col py-6 px-3
        bg-mfr-sidebar border-r border-mfr-border
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <div className="flex-shrink-0 h-14 bg-white border-b border-mfr-border flex items-center justify-between px-4 lg:px-6 gap-3">
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
