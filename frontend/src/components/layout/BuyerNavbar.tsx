import { useNavigate } from 'react-router-dom'
import { ScanLine, Package, Handshake, PhoneCall, User, ChevronDown, Home } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface Props {
  activePage?: 'home' | 'tracking' | 'orders' | 'negotiation' | 'schedule'
}

const NAV_ITEMS = [
  { label: 'Home',                   icon: Home,      to: '/buyer/dashboard', key: 'home'        },
  { label: 'Tracking',               icon: ScanLine,  to: '/buyer/shipments', key: 'tracking'    },
  { label: 'My Orders',              icon: Package,   to: '/buyer/orders',    key: 'orders'      },
  { label: 'Negotiation & Chat Now', icon: Handshake, to: '/buyer/dashboard', key: 'negotiation' },
  { label: 'Schedule Call',          icon: PhoneCall, to: '/buyer/schedule',  key: 'schedule'    },
]

export default function BuyerNavbar({ activePage }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F0E6D8] px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <h1
          className="text-xl sm:text-2xl font-black text-slate-900 cursor-pointer flex-shrink-0"
          onClick={() => navigate('/buyer/dashboard')}
        >
          Sephio
        </h1>

        {/* Nav pills */}
        <nav className="hidden md:flex items-center gap-2">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => navigate(item.to)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                activePage === item.key
                  ? 'bg-[#FFF0E0] border-[#F5C89A] text-[#C47A2B]'
                  : 'bg-white border-[#EEE] text-slate-600 hover:border-[#F5C89A] hover:text-[#C47A2B]'
              }`}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Account */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-[#EEE] bg-white text-slate-700 text-sm font-semibold hover:border-[#F5C89A] transition-all"
          >
            <User size={15} />
            <span className="hidden sm:inline">{user ? user.name?.split(' ')[0] : 'My Account'}</span>
            <ChevronDown size={13} />
          </button>
        </div>
      </div>
    </header>
  )
}
