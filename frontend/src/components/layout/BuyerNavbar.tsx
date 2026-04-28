import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, Package, Handshake, PhoneCall, User, ChevronDown, Home, ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '@/components/NotificationBell'

interface Props {
  activePage?: 'home' | 'tracking' | 'orders' | 'negotiation' | 'schedule'
}

const NAV_ITEMS = [
  { label: 'Home',                    icon: Home,      to: '/buyer/dashboard', key: 'home'        },
  { label: 'Tracking',               icon: ScanLine,  to: '/buyer/shipments', key: 'tracking'    },
  { label: 'My Orders',              icon: Package,   to: '/buyer/orders',    key: 'orders'      },
  { label: 'Negotiation & Chat Now', icon: Handshake, to: '/buyer/negotiation', key: 'negotiation' },
  { label: 'Schedule Call',          icon: PhoneCall, to: '/buyer/schedule',  key: 'schedule'    },
]

export default function BuyerNavbar({ activePage }: Props) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [accountOpen, setAccountOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E1DA] overflow-hidden" style={{ height: 64 }}>
      <div className="flex items-center justify-between gap-4 h-full">
        {/* Logo */}
        <div
          className="cursor-pointer flex-shrink-0"
          style={{ width: 220, height: 64, overflow: 'hidden' }}
          onClick={() => navigate('/buyer/dashboard')}
        >
          <img
            src="/vyawan (3).png"
            alt="Vyawan"
            style={{ height: '100%', width: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>

        {/* Nav pills */}
        <nav className="hidden md:flex items-center gap-2 flex-1 justify-center">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => navigate(item.to)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                activePage === item.key
                  ? 'bg-[#FCE7D6] border-[#F9D5B8] text-[#5D4037]'
                  : 'bg-white border-[#E5E1DA] text-slate-600 hover:border-[#F9D5B8] hover:text-[#5D4037]'
              }`}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0 pr-4 sm:pr-6">
          <NotificationBell />

          {/* Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAccountOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E1DA] bg-white text-slate-700 text-sm font-semibold hover:border-[#F9D5B8] hover:text-[#5D4037] transition-all"
            >
              <User size={15} />
              <span className="hidden sm:inline">{user ? user.name?.split(' ')[0] : 'Account'}</span>
              <ChevronDown size={13} />
            </button>

            <AnimatePresence>
              {accountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                  {[
                    { label: 'My Orders',    path: '/buyer/orders' },
                    { label: 'Negotiations', path: '/buyer/negotiation' },
                    { label: 'Shipments',    path: '/buyer/shipments' },
                  ].map(item => (
                    <button key={item.label} onClick={() => { setAccountOpen(false); navigate(item.path); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-slate-100">
                    <button onClick={() => { setAccountOpen(false); logout(); navigate('/login'); }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
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
