import { useState, useMemo } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '../NotificationBell'
import { VyawanIcon } from '../VyawanLogo'
import { VerticalDock } from '../Dock'
import {
  LayoutDashboard, Users, Factory, ShoppingCart,
  AlertCircle, BarChart2, Settings, LogOut, Shield,
  Menu, X, CreditCard, Megaphone, ClipboardCheck,
  ChevronRight, ShieldCheck, Activity, ShieldAlert,
  Ghost, List, Clock, RotateCcw, History, Lock,
  Percent, Banknote, Layers, Map, Zap, Target,
  FileText, Sliders, Grid, DollarSign, Eye, Gavel, PieChart,
} from 'lucide-react'

const ADMIN_NAV = [
  { 
    label: 'Dashboard', 
    to: '/admin/dashboard', 
    icon: LayoutDashboard 
  },
  { 
    label: 'Users', 
    icon: Users,
    subItems: [
      { icon: Factory,        label: 'Manufacturers', to: '/admin/manufacturers' },
      { icon: ShieldCheck,    label: 'Verification',  to: '/admin/verification' },
      { icon: Users,          label: 'Buyers',        to: '/admin/buyers' },
    ]
  },
  {
    label: 'Monitoring',
    icon: Eye,
    subItems: [
      { icon: History,        label: 'Global Logs',   to: '/admin/logs' },
      { icon: ShieldAlert,    label: 'Risk Control', to: '/admin/fraud' },
    ]
  },
  {
    label: 'Orders',
    icon: ShoppingCart,
    subItems: [
      { icon: List,           label: 'All Orders',     to: '/admin/orders' },
      { icon: ShieldAlert,    label: 'Fulfillment Gap', to: '/admin/orders/stuck' },
    ]
  },
  {
    label: 'Disputes',
    icon: Gavel,
    subItems: [
      { icon: AlertCircle,    label: 'Escalated',      to: '/admin/complaints?status=escalated' },
      { icon: RotateCcw,      label: 'Returns',        to: '/admin/disputes/returns' },
      { icon: History,        label: 'Resolution Hub', to: '/admin/complaints' },
    ]
  },
  {
    label: 'Finance',
    icon: Banknote,
    subItems: [
      { icon: Lock,           label: 'Escrow',         to: '/admin/finance/escrow' },
      { icon: Percent,        label: 'Commission',     to: '/admin/finance/commission' },
      { icon: Banknote,       label: 'Refunds',        to: '/admin/finance/refunds' },
    ]
  },
  {
    label: 'Analytics',
    icon: PieChart,
    subItems: [
      { icon: BarChart2,      label: 'Platform',       to: '/admin/analytics' },
      { icon: Layers,         label: 'Sectors',        to: '/admin/analytics/sectors' },
      { icon: Map,            label: 'Geography',      to: '/admin/analytics/geography' },
      { icon: Zap,            label: 'Performance',    to: '/admin/analytics/performance' },
    ]
  },
  { 
    label: 'Plans', 
    to: '/admin/plans', 
    icon: Target 
  },
  {
    label: 'Communicate',
    icon: Megaphone,
    subItems: [
      { icon: Megaphone,      label: 'Broadcast',      to: '/admin/content' },
      { icon: FileText,       label: 'Templates',      to: '/admin/communicate/templates' },
    ]
  },
  {
    label: 'Settings',
    icon: Settings,
    subItems: [
      { icon: Sliders,        label: 'General',        to: '/admin/settings' },
      { icon: Grid,           label: 'Categories',      to: '/admin/settings/categories' },
      { icon: DollarSign,     label: 'Commission',     to: '/admin/settings/commission' },
      { icon: Shield,         label: 'Security',       to: '/admin/settings/security' },
    ]
  },
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
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  // ── Finding Active Category & Sub-Items ────────────────────────────────────
  const activeCategory = useMemo(() => {
    return ADMIN_NAV.find(cat => {
      if (cat.to && location.pathname === cat.to) return true
      if (cat.subItems) {
        return cat.subItems.some(sub => location.pathname === sub.to || location.pathname.startsWith(sub.to))
      }
      return false
    })
  }, [location.pathname])

  // Build dock items from ADMIN_NAV
  const navDockItems = ADMIN_NAV.map(item => ({
    icon: <item.icon size={16} />,
    label: item.label,
    onClick: () => {
      const target = item.to || item.subItems?.[0]?.to || '/admin/dashboard'
      navigate(target)
      setSidebarOpen(false)
    },
    isActive: activeCategory?.label === item.label,
  }))

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: S.bg, borderRight: `1px solid ${S.border}` }}>
      {/* Logo — edge to edge */}
      <div className="flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: `1px solid ${S.border}` }}>
        <VyawanIcon size={44} className="w-full" />
        <button className="lg:hidden p-1 rounded-lg flex-shrink-0 absolute right-2 top-3" style={{ color: S.muted }}
          onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
      </div>

      {/* Nav — VerticalDock with magnification animation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <VerticalDock
          items={navDockItems}
          baseItemSize={36}
          magnification={42}
          distance={100}
          spring={{ mass: 0.1, stiffness: 180, damping: 14 }}
        />
      </div>

      {/* User + Logout */}
      <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${S.border}` }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: 'rgba(93,64,55,0.06)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: S.brown }}>
            {user?.name?.[0] ?? 'A'}
          </div>
          <div className="flex-1 min-w-0 text-[10px]">
             <p className="font-bold truncate" style={{ color: S.dark }}>{user?.name ?? 'Admin'}</p>
             <p className="truncate opacity-60" style={{ color: S.muted }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all text-red-500 hover:bg-red-50">
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
        w-60 flex-shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex-shrink-0 bg-white px-5 h-16 flex items-center justify-between border-b"
          style={{ borderColor: S.border }}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-xl"
              style={{ color: S.muted }}
              onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
               <h2 className="text-base font-black tracking-tight text-slate-800">{activeCategory?.label ?? 'Vyawan'}</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Management Console</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sp-peach border border-sp-peach-border">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: S.brown }} />
              <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: S.brown }}>System Admin</span>
            </div>
          </div>
        </header>

        {/* Sub-Navbar (Horizontal Tabs) */}
        {activeCategory?.subItems && (
          <nav className="flex-shrink-0 bg-white border-b px-6 flex items-center gap-6 overflow-x-auto no-scrollbar h-12"
            style={{ borderColor: S.border }}>
            {activeCategory.subItems.map((sub, sIdx) => {
              const subIsActive = location.pathname === sub.to || location.pathname.startsWith(sub.to)
              return (
                <NavLink
                  key={sIdx}
                  to={sub.to}
                  className={`flex items-center gap-2 h-full border-b-2 px-1 transition-all text-xs font-bold uppercase tracking-widest whitespace-nowrap ${
                    subIsActive 
                      ? 'border-sp-brown text-sp-brown' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <sub.icon size={13} />
                  {sub.label}
                </NavLink>
              )
            })}
          </nav>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto bg-[#F8F7F5]">
           <div className="p-6">
              <Outlet />
           </div>
        </div>
      </main>
    </div>
  )
}
