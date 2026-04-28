import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, Package, Handshake, PhoneCall, User, ChevronDown, Home, ShoppingCart, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '@/components/NotificationBell'
import { api } from '@/lib/api'

interface Props {
  activePage?: 'home' | 'tracking' | 'orders' | 'negotiation' | 'schedule'
}

const NAV_ITEMS = [
  { label: 'Home',                    icon: Home,      to: '/buyer/dashboard', key: 'home'        },
  { label: 'Tracking',               icon: ScanLine,  to: '/buyer/shipments', key: 'tracking'    },
  { label: 'My Orders',              icon: Package,   to: '/buyer/orders',    key: 'orders'      },
  { label: 'Negotiations',            icon: Handshake, to: '/buyer/negotiation', key: 'negotiation' },
  { label: 'Schedule Call',          icon: PhoneCall, to: '/buyer/schedule',  key: 'schedule'    },
]

export default function BuyerNavbar({ activePage }: Props) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [accountOpen, setAccountOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    api.getCart().then(res => {
      if (res && res.items) setCartCount(res.items.length)
    }).catch(() => {})
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E5E1DA] overflow-hidden shadow-sm" style={{ height: 72 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-8">
        {/* Logo */}
        <div
          className="cursor-pointer flex-shrink-0 flex items-center transition-transform hover:scale-105 active:scale-95"
          onClick={() => navigate('/buyer/dashboard')}
        >
          <img
            src="/vyawan (3).png"
            alt="Vyawan"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Nav pills */}
        <nav className="hidden lg:flex items-center gap-3">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => navigate(item.to)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border ${
                activePage === item.key
                  ? 'bg-[#FCE7D6] border-[#F9D5B8] text-[#5D4037] shadow-sm'
                  : 'bg-white border-[#E5E1DA] text-[#475569] hover:border-[#F9D5B8] hover:text-[#5D4037]'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/buyer/checkout')}
            className="relative p-2.5 rounded-full text-slate-500 hover:text-[#5D4037] hover:bg-[#FCE7D6]/50 transition-all group"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          <NotificationBell />

          <div className="w-px h-6 bg-[#E5E1DA] mx-1 hidden sm:block" />

          {/* Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAccountOpen(o => !o)}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border border-[#E5E1DA] bg-white text-slate-700 text-sm font-bold hover:border-[#F9D5B8] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-[#5D4037] flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="hidden sm:inline">
                {user ? user.name?.split(' ')[0] : 'Account'}
              </span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {accountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#E5E1DA] overflow-hidden z-50 p-1"
                >
                  <div className="px-4 py-3 mb-1 border-b border-slate-50">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Buyer Account</p>
                  </div>

                  <div className="space-y-0.5">
                    {[
                      { label: 'My Orders',    icon: Package,  path: '/buyer/orders' },
                      { label: 'Negotiations', icon: Handshake, path: '/buyer/negotiation' },
                      { label: 'Tracking',     icon: ScanLine, path: '/buyer/shipments' },
                    ].map(item => (
                      <button key={item.label} onClick={() => { setAccountOpen(false); navigate(item.path); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-[#FCE7D6]/30 hover:text-[#5D4037] rounded-xl transition-all">
                        <item.icon size={15} />
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-1 pt-1 border-t border-slate-50">
                    <button onClick={() => { setAccountOpen(false); logout(); navigate('/login'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors rounded-xl">
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
