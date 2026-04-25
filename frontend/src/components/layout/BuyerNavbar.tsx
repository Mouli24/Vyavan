import { useNavigate } from 'react-router-dom'
import { ScanLine, Package, Handshake, PhoneCall, User, ChevronDown, Home } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
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
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const NAV_ITEMS = getNavItems(t)

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E1DA] overflow-hidden">
      <div className="flex items-center justify-between gap-4" style={{ height: 64 }}>
        {/* Logo — absolute left edge, tall, no padding */}
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

        {/* Right: Account & Language */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 pr-4 sm:pr-6">
          <LanguageToggle />
          <div className="w-px h-6 bg-gray-200 hidden sm:block" />
          
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-[#E5E1DA] bg-white text-slate-700 text-sm font-semibold hover:border-[#F9D5B8] hover:text-[#5D4037] cursor-pointer transition-all focus:outline-none"
              >
                <div className="w-6 h-6 rounded-full bg-[#FCE7D6] flex items-center justify-center text-[#5D4037]">
                   <User size={14} />
                </div>
                <span className="hidden sm:inline lowercase first-letter:uppercase">{user ? user.name?.split(' ')[0] : 'Account'}</span>
                <ChevronDown size={13} className="text-[#A89F91]" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                align="end" 
                sideOffset={8}
                className="z-[100] w-48 bg-white rounded-2xl p-1.5 shadow-2xl border border-[#E5E1DA] animate-in fade-in zoom-in-95"
              >
                <div className="px-3 py-2 border-b border-[#F5F2ED] mb-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#A89F91]">Signed in as</p>
                   <p className="text-xs font-bold text-[#1A1A1A] truncate">{user?.email}</p>
                </div>
                
                <DropdownMenu.Item 
                  onClick={() => navigate('/buyer/profile')}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#F5F2ED] hover:text-[#5D4037] rounded-xl cursor-pointer outline-none transition-colors"
                >
                  Profile Details
                </DropdownMenu.Item>
                
                <DropdownMenu.Item 
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#F5F2ED] hover:text-[#5D4037] rounded-xl cursor-pointer outline-none transition-colors"
                >
                  Account Settings
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-[#F5F2ED] my-1" />
                
                <DropdownMenu.Item 
                  onClick={() => { logout?.(); navigate('/login'); }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer outline-none transition-colors"
                >
                  Sign Out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  )
}


