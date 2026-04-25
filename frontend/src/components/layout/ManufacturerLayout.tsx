import { useState } from 'react'
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import NotificationBell from '../NotificationBell'
import LanguageToggle from '../LanguageToggle'
import { VerticalDock } from '../Dock'
import { VyawanIcon } from '../VyawanLogo'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  LayoutDashboard, Store, Truck, MessageSquare, CreditCard,
  AlertCircle, Settings, HelpCircle, Zap, LogOut, ClipboardList,
  ShoppingCart, Boxes, CalendarClock, CalendarDays, Menu, X, Star, Users, Lock, KeyRound, ChevronDown
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const getNavItems = (t: any) => [
  { icon: <LayoutDashboard size={16} />, label: t('navigation.overview'),            to: '/manufacturer/overview' },
  { icon: <Store size={16} />,           label: t('navigation.myStore'),            to: '/manufacturer/store' },
  { icon: <ShoppingCart size={16} />,    label: t('navigation.orders'),              to: '/manufacturer/orders' },
  { icon: <Boxes size={16} />,           label: t('navigation.inventory'),           to: '/manufacturer/inventory' },
  { icon: <Truck size={16} />,           label: t('navigation.shipment'),            to: '/manufacturer/shipment' },
  { icon: <MessageSquare size={16} />,   label: t('navigation.negotiation'),         to: '/manufacturer/negotiation' },
  { icon: <CreditCard size={16} />,      label: t('navigation.payment'),             to: '/manufacturer/payment' },
  { icon: <AlertCircle size={16} />,     label: t('navigation.complaints'),          to: '/manufacturer/complaints' },
  { icon: <CalendarClock size={16} />,   label: t('navigation.scheduledCalls', 'Scheduled Calls'),     to: '/manufacturer/scheduled-calls' },
  { icon: <CalendarDays size={16} />,    label: t('navigation.holidays', 'Holiday & Availability'), to: '/manufacturer/holidays' },
  { icon: <Star size={16} />,            label: 'Reviews',                           to: '/manufacturer/reviews' },
  { icon: <Users size={16} />,           label: 'Buyer Groups',                      to: '/manufacturer/groups' },
  { icon: <ClipboardList size={16} />,   label: t('navigation.onboarding'),          to: '/manufacturer/onboarding' },
]

export default function ManufacturerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const NAV_ITEMS = getNavItems(t)

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
      label: t('navigation.settings'),
      onClick: () => { navigate('/manufacturer/settings'); setSidebarOpen(false) },
      isActive: location.pathname === '/manufacturer/settings',
    },
    {
      icon: <HelpCircle size={16} />,
      label: 'Help Center',
      onClick: () => {},
    },
    {
      icon: <LogOut size={16} />,
      label: t('navigation.logout'),
      onClick: () => { logout(); navigate('/') },
      className: 'hover:!bg-red-50 hover:!text-red-600',
    },
  ]

  const SidebarContent = () => (
    <>
      {/* Logo — edge to edge */}
      <div className="mb-4 flex items-center justify-between">
        <Link to="/manufacturer" className="flex-1 min-w-0" onClick={() => setSidebarOpen(false)}>
          <VyawanIcon size={44} className="w-full" />
        </Link>
        <button className="lg:hidden p-1 text-mfr-muted flex-shrink-0 mr-2" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
      </div>

      {/* Primary nav — VerticalDock */}
      <div className="flex-1 overflow-y-auto px-3">
        <VerticalDock
          items={navDockItems}
          baseItemSize={36}
          magnification={42}
          distance={100}
          spring={{ mass: 0.1, stiffness: 180, damping: 14 }}
        />
      </div>

      {/* Upgrade card */}
      <div className="mt-4 mx-3 bg-mfr-peach/70 border border-mfr-border rounded-xl p-4 mb-3">
        <Zap className="text-mfr-brown mb-2" size={16} />
        <h4 className="text-[11px] font-semibold text-mfr-brown mb-2">Upgrade to Pro</h4>
        <p className="text-[10px] text-mfr-muted mb-3 leading-relaxed">Get advanced analytics &amp; AI features.</p>
        <button className="w-full bg-mfr-brown text-white rounded-lg text-[11px] font-semibold h-8 hover:bg-mfr-brown-hover transition-colors">
          Upgrade Now
        </button>
      </div>

      {/* Bottom items — VerticalDock */}
      <div className="pt-2 border-t border-mfr-border px-3">
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

  // ── Activation Handler ─────────────────────────────────────────────────────
  const [activationCode, setActivationCode] = useState('')
  const [activating, setActivating] = useState(false)

  const handleActivate = async () => {
    if (activationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }
    setActivating(true)
    try {
      await api.activateManufacturer(activationCode)
      toast.success('Dashboard activated! Welcome.')
      // Refresh the user/profile to clear the gate
      window.location.reload() 
    } catch (e: any) {
      toast.error(e.message || 'Activation failed')
    } finally {
      setActivating(false)
    }
  }

  const isApprovedButNotActivated = user?.role === 'manufacturer' && 
                                    user?.manufacturerStatus === 'approved' && 
                                    user?.isActivated === false

  return (
    <div className="flex h-screen overflow-hidden bg-white">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 flex-shrink-0 flex flex-col pt-0 pb-6 px-0
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
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <div className="w-px h-6 bg-gray-200 hidden sm:block mx-1" />
            <NotificationBell />
            <div className="w-px h-6 bg-gray-200 hidden sm:block mx-1" />
            
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-mfr-border bg-white text-mfr-dark text-sm font-semibold hover:border-mfr-brown transition-all focus:outline-none cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-mfr-brown-pale flex items-center justify-center text-mfr-brown">
                     <Users size={14} />
                  </div>
                  <span className="hidden sm:inline lowercase first-letter:uppercase">{user ? user.name?.split(' ')[0] : 'Merchant'}</span>
                  <ChevronDown size={13} className="text-mfr-muted" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content 
                  align="end" 
                  sideOffset={8}
                  className="z-[100] w-52 bg-white rounded-2xl p-1.5 shadow-2xl border border-mfr-border animate-in fade-in zoom-in-95"
                >
                  <div className="px-3 py-2 border-b border-mfr-bg mb-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-mfr-muted">Store Account</p>
                     <p className="text-xs font-bold text-mfr-dark truncate">{user?.email}</p>
                  </div>
                  
                  <DropdownMenu.Item 
                    onClick={() => navigate('/manufacturer/settings')}
                    className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-mfr-dark hover:bg-mfr-bg rounded-xl cursor-pointer outline-none transition-colors"
                  >
                    <Settings size={14} className="text-mfr-muted" />
                    Business Settings
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Item 
                    className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-mfr-dark hover:bg-mfr-bg rounded-xl cursor-pointer outline-none transition-colors"
                  >
                    <Star size={14} className="text-mfr-muted" />
                    Reviews Center
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="h-px bg-mfr-bg my-1" />
                  
                  <DropdownMenu.Item 
                    onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer outline-none transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-sp-bg/20 relative">
          {isApprovedButNotActivated ? (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl border border-mfr-border shadow-2xl p-8 max-w-sm w-full text-center">
                <div className="w-16 h-16 bg-mfr-brown-pale rounded-full flex items-center justify-center mx-auto mb-6">
                  <KeyRound className="w-8 h-8 text-mfr-brown" />
                </div>
                <h3 className="text-xl font-bold text-mfr-dark mb-2">Activate Your Dashboard</h3>
                <p className="text-sm text-mfr-muted mb-6 leading-relaxed">
                  Your account is approved! Enter the <strong>6-digit activation code</strong> sent to your registered email to unlock your dashboard.
                </p>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mfr-muted" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      className="w-full pl-12 pr-4 py-3 bg-mfr-bg border border-mfr-border rounded-xl text-center text-lg font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-mfr-brown/20 focus:border-mfr-brown"
                      value={activationCode}
                      onChange={e => setActivationCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  
                  <button
                    onClick={handleActivate}
                    disabled={activating || activationCode.length !== 6}
                    className="w-full py-3.5 bg-mfr-brown hover:bg-mfr-brown-hover text-white font-bold rounded-xl shadow-lg hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {activating ? 'Activating...' : 'Activate Dashboard'}
                    <Zap className="w-4 h-4" />
                  </button>
                  
                  <p className="text-xs text-mfr-muted">
                    Didn't receive the code? Check your spam folder or contact support.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}
