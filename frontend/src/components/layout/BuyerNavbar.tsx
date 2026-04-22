import { useNavigate } from 'react-router-dom'
import { ScanLine, Package, Handshake, PhoneCall, User, ChevronDown, Home } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import VyawanLogo from '@/components/VyawanLogo'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '../LanguageToggle'

interface Props {
  activePage?: 'home' | 'tracking' | 'orders' | 'negotiation' | 'schedule'
}

const getNavItems = (t: any) => [
  { label: t('navigation.home', 'Home'),                    icon: Home,      to: '/buyer/dashboard', key: 'home'        },
  { label: t('navigation.tracking', 'Tracking'),            icon: ScanLine,  to: '/buyer/shipments', key: 'tracking'    },
  { label: t('navigation.orders', 'My Orders'),             icon: Package,   to: '/buyer/orders',    key: 'orders'      },
  { label: t('navigation.negotiation', 'Negotiation & Chat Now'), icon: Handshake, to: '/buyer/negotiation', key: 'negotiation' },
  { label: t('navigation.schedule', 'Schedule Call'),       icon: PhoneCall, to: '/buyer/schedule',  key: 'schedule'    },
]

export default function BuyerNavbar({ activePage }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation()
  const NAV_ITEMS = getNavItems(t)

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F0E6D8] px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="cursor-pointer flex-shrink-0" onClick={() => navigate('/buyer/dashboard')}>
          <VyawanLogo size={26} />
        </div>

        {/* Nav pills */}
        <nav className="hidden md:flex items-center gap-2">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => navigate(item.to)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                activePage === item.key
                  ? 'bg-[#F5F3FF] border-[#C4B5FD] text-[#7C3AED]'
                  : 'bg-white border-[#EEE] text-slate-600 hover:border-[#C4B5FD] hover:text-[#7C3AED]'
              }`}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Account & Language */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <LanguageToggle />
          <div className="w-px h-6 bg-gray-200 hidden sm:block" />
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-[#EEE] bg-white text-slate-700 text-sm font-semibold hover:border-[#C4B5FD] transition-all"
          >
            <User size={15} />
            <span className="hidden sm:inline">{user ? user.name?.split(' ')[0] : t('common.myAccount', 'My Account')}</span>
            <ChevronDown size={13} />
          </button>
        </div>
      </div>
    </header>
  )
}


