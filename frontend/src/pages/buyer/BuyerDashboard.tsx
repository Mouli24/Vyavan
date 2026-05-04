import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Truck, Handshake, ScanLine,
  Search, ChevronDown, Loader2,
  Share2, AtSign, Camera, ShoppingBag,
  User, Package, X, Star,
  PhoneCall, Home, Tag, Factory, Trophy, ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { api, Product } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '@/components/NotificationBell'
import VyawanLogo from '@/components/VyawanLogo'
import HelpCenterModal from '@/components/HelpCenterModal'
import ProfileEditModal from '@/components/ProfileEditModal'

// ── Category color map ────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Electronics:        'text-orange-500',
  Textiles:           'text-blue-500',
  'Home & Furniture': 'text-purple-500',
  'Beauty & Personal Care': 'text-pink-500',
  Machinery:          'text-slate-500',
  FMCG:               'text-green-500',
  Automotive:         'text-red-500',
  Construction:       'text-amber-600',
  Agriculture:        'text-lime-600',
  Pharmaceuticals:    'text-teal-500',
  default:            'text-[#6B4E3D]',
}

const PILL_BG: Record<string, string> = {
  Electronics:        'bg-orange-50 border-orange-100',
  Textiles:           'bg-amber-50 border-amber-100',
  'Home & Furniture': 'bg-stone-50 border-stone-100',
  'Beauty & Personal Care': 'bg-rose-50 border-rose-100',
  default:            'bg-[#F5F2ED] border-[#E5E1DA]',
}

const ADD_BTN_BG: Record<string, string> = {
  Electronics:        'bg-orange-100 hover:bg-orange-200 text-orange-700',
  Textiles:           'bg-amber-100 hover:bg-amber-200 text-amber-700',
  'Home & Furniture': 'bg-stone-100 hover:bg-stone-200 text-stone-700',
  'Beauty & Personal Care': 'bg-rose-100 hover:bg-rose-200 text-rose-700',
  default:            'bg-[#FCE7D6] hover:bg-[#F9D5B8] text-[#5D4037]',
}

const SORT_OPTIONS = ['Popular', 'Price: Low to High', 'Price: High to Low', 'Newest']

const FEATURE_PILLS = [
  { icon: ShoppingCart, label: '1,250+',          sub: 'Products Available',  bg: '#FCE7D6', iconBg: '#F9D5B8', iconColor: '#5D4037',  to: '/buyer/browse'      },
  { icon: Truck,        label: 'Fast & Reliable',  sub: 'Shipping',            bg: '#EBF3FF', iconBg: '#DBEAFE', iconColor: '#2563EB',  to: '/buyer/shipments'   },
  { icon: Handshake,    label: 'Safe Negotiation', sub: 'with Suppliers',      bg: '#F3EEFF', iconBg: '#EDE9FE', iconColor: '#7C3AED',  to: '/buyer/negotiation' },
  { icon: ScanLine,     label: 'Track Orders',     sub: 'in Real Time',        bg: '#ECFDF5', iconBg: '#D1FAE5', iconColor: '#059669',  to: '/buyer/orders'      },
]

interface CartItem { product: Product; qty: number }

export default function BuyerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Popular')
  const [sortOpen, setSortOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [rewards, setRewards] = useState<any[]>([])
  const [accountOpen, setAccountOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const directAccessCode = localStorage.getItem('directStoreAccess');
    
    // Fetch Products
    api.getProducts(directAccessCode ? { manufacturer: directAccessCode } : {})
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))

    // Fetch Cart
    api.getCart()
      .then(res => {
        if (res && res.items) {
          setCart(res.items.map((i: any) => ({ product: i.product, qty: i.quantity })))
        }
      })
      .catch(console.error)

    api.getMyRewards().then(setRewards).catch(console.error)
  }, [])

  const addToCart = async (product: Product, isSample = false) => {
    try {
      const res = await api.addToCart(product._id, 1, isSample);
      if (res && res.items) {
        setCart(res.items.map((i: any) => ({ 
          product: i.product, 
          qty: i.quantity,
          isSample: i.isSample 
        })))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const buyNow = async (product: Product, isSample = false) => {
    await addToCart(product, isSample);
    navigate('/buyer/checkout');
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const filtered = products
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.category ?? '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'Price: Low to High') return (a.price ?? 0) - (b.price ?? 0)
      if (sort === 'Price: High to Low') return (b.price ?? 0) - (a.price ?? 0)
      return 0
    })

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-sp-border overflow-hidden" style={{ height: 64 }}>
        <div className="flex items-center justify-between gap-4 h-full">
          {/* Logo — flush left, full height */}
          <div
            className="cursor-pointer flex-shrink-0"
            style={{ width: 220, height: 64, overflow: 'hidden' }}
            onClick={() => navigate('/buyer/browse')}
          >
            <img
              src="/vyawan (3).png"
              alt="Vyawan"
              style={{ height: '100%', width: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>

          {/* Nav pills */}
          <nav className="hidden md:flex items-center gap-2 flex-1 justify-center">
            {[
              { label: 'Home',                   icon: Home,        to: '/buyer/dashboard', active: true  },
              { label: 'Tracking',               icon: ScanLine,    to: '/buyer/shipments', active: false },
              { label: 'My Orders',              icon: Package,     to: '/buyer/orders',    active: false },
              { label: 'Negotiation & Chat Now', icon: Handshake,   to: '/buyer/negotiation', active: false },
              { label: 'Schedule Call',          icon: PhoneCall,   to: '/buyer/schedule',  active: false },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  item.active
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
            {/* Cart */}
            <button
              onClick={() => setCartOpen(o => !o)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-sp-border bg-white text-slate-700 text-sm font-semibold hover:border-[#F9D5B8] transition-all"
            >
              <ShoppingCart size={16} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                  style={{ background: '#5D4037' }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Account */}
            <div className="relative">
              <button
                onClick={() => setAccountOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-sp-border bg-white text-slate-700 text-sm font-semibold hover:border-[#F9D5B8] transition-all"
              >
                <User size={15} />
                {user ? user.name?.split(' ')[0] : 'My Account'}
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
                      { label: 'Profile Settings', onClick: () => setProfileOpen(true) },
                      { label: 'My Orders', path: '/buyer/orders' },
                      { label: 'Negotiations', path: '/buyer/negotiation' },
                      { label: 'Shipments', path: '/buyer/shipments' },
                    ].map(item => (
                      <button 
                        key={item.label} 
                        onClick={() => { 
                          setAccountOpen(false); 
                          if (item.onClick) item.onClick();
                          else navigate(item.path!); 
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                    <div className="border-t border-slate-100">
                      <button onClick={() => { setAccountOpen(false); logout(); navigate('/login'); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Hero Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #FFF3E8 0%, #FCE7D6 100%)', border: '1px solid #F9D5B8' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-10 py-8 sm:py-10 gap-6">
            <div className="max-w-md">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#F9D5B8]/60 text-[#5D4037] mb-4">
                Welcome Back!
              </span>
              <h2 className="text-4xl font-black text-slate-900 leading-tight mb-3">
                Discover Quality Products<br />from Trusted Suppliers
              </h2>
              <p className="text-slate-500 text-sm mb-6">Browse, negotiate, and buy with confidence.</p>
              <button
                onClick={() => navigate('/buyer/browse')}
                className="px-7 py-3 rounded-full font-bold text-sm border-2 transition-all"
                style={{ color: '#5D4037', borderColor: '#5D4037' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='#5D4037'; (e.currentTarget as HTMLElement).style.color='#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='#5D4037' }}
              >
                Explore Catalog
              </button>
            </div>

            {/* Illustration */}
            <div className="hidden md:flex items-end gap-3 pr-4">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
                <div className="w-28 h-28 rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                  style={{ background: 'linear-gradient(135deg, #FCE7D6, #F9D5B8)' }}>
                  <ShoppingBag size={42} style={{ color: '#5D4037' }} />
                </div>
              </motion.div>
              <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.3 }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
                  style={{ background: 'linear-gradient(135deg, #F5E6D3, #EDD5B8)' }}>
                  <Package size={32} style={{ color: '#6B4E3D' }} />
                </div>
              </motion.div>
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 0.6 }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-md border-2 border-white"
                  style={{ background: 'linear-gradient(135deg, #EDE8DF, #D9D2C7)' }}>
                  <Truck size={24} style={{ color: '#8B7355' }} />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ── Feature Pills ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURE_PILLS.map((pill, i) => (
            <motion.div key={pill.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }} onClick={() => navigate(pill.to)}
              className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all border border-slate-100"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm flex-shrink-0"
                style={{ background: pill.bg }}>
                <pill.icon size={20} style={{ color: pill.iconColor }} />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight text-slate-900">{pill.label}</p>
                <p className="text-[10px] uppercase font-black tracking-widest mt-0.5" style={{ color: pill.iconColor }}>{pill.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Active Sales & Campaigns ── */}
        {(() => {
          const allCampaigns: any[] = (() => {
            try { return JSON.parse(localStorage.getItem('vyawan_campaigns') || '[]') } catch { return [] }
          })()
          const live = allCampaigns.filter((c: any) => {
            const now = new Date(); return now >= new Date(c.startDate) && now <= new Date(c.endDate)
          })
          if (live.length === 0) return null
          return (
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sales & Offers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {live.map((c: any) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-2xl border">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#5D4037' }}>
                      <Tag size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: '#1A1A1A' }}>{c.name}</p>
                      <p className="text-xs text-sp-muted">{c.manufacturerName} · {c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase flex-shrink-0">Live</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── Premium Rewards (New) ── */}
        {rewards.length > 0 && (
          <div className="animate-in fade-in slide-in-from-left-5 duration-700">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Trophy size={16} className="text-amber-500" /> Your Premium Perks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white border-2 border-[#FCE7D6] rounded-3xl p-5 shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Factory size={100} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#EDE8DF] flex items-center justify-center text-[#5D4037] shadow-inner">
                      <Star size={20} className="fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-[#8B7355] uppercase tracking-widest leading-none mb-1">
                        {reward.manufacturer?.company || 'Manufacturer'}
                      </p>
                      <h4 className="text-lg font-black text-slate-900 leading-tight truncate">{reward.groupName}</h4>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-dashed border-[#F9D5B8] flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-500">Active Reward:</span>
                     <span className="bg-[#7C3AED] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg shadow-purple-500/20">
                        {reward.rewardType === 'percentage_discount' ? `${reward.rewardValue}% OFF` :
                         reward.rewardType === 'flat_discount' ? `₹${reward.rewardValue} OFF` :
                         reward.rewardType === 'free_shipping' ? 'FREE SHIPPING' : 'PRIORITY'}
                     </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Featured Products ── */}
        <div className="mt-12">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black text-slate-900">Featured Products</h3>
            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-sp-border bg-white text-sm text-slate-600 font-medium hover:border-[#F9D5B8] transition-all"
              >
                Sort: {sort} <ChevronDown size={13} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-sp-border overflow-hidden z-20 w-48"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setSort(opt); setSortOpen(false) }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${sort === opt ? 'font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                        style={sort === opt ? { background: '#FCE7D6', color: '#5D4037' } : {}}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Full-width search bar */}
          <div className="relative mb-6">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products by name or category..."
              className="w-full pl-12 pr-5 py-3.5 rounded-2xl border border-sp-border bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#F9D5B8] focus:ring-2 focus:ring-[#F9D5B8]/20 shadow-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin" style={{ color: '#5D4037' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((product, idx) => {
                const cat = product.category ?? 'default'
                const catColor = CAT_COLOR[cat] ?? CAT_COLOR.default
                const pillBg = PILL_BG[cat] ?? PILL_BG.default
                const btnBg = ADD_BTN_BG[cat] ?? ADD_BTN_BG.default
                const inCart = cart.find(i => i.product._id === product._id)

                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => setSelectedProduct(product)}
                    className="bg-white rounded-[1.5rem] overflow-hidden border border-sp-border hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] bg-slate-50 overflow-hidden relative">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <Package size={40} />
                        </div>
                      )}
                      
                      {/* OOS Overlay (New) */}
                      {(product.stock ?? 0) <= 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg shadow-xl translate-y-1">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-[10px] font-extrabold uppercase tracking-widest ${catColor}`}>{cat}</p>
                        {(product.manufacturer as any)?.manufacturerStatus === 'approved' && (
                          <div className="flex items-center gap-1 bg-sp-mint/30 px-1.5 py-0.5 rounded-full" title="Verified Manufacturer">
                            <ShieldCheck className="w-3 h-3 text-sp-success" />
                            <span className="text-[9px] font-bold text-sp-success uppercase">Verified</span>
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight mb-2 line-clamp-2">{product.name}</h4>
                      <p className="text-base font-black text-slate-900 mb-3">
                        ₹{(product.price ?? 0).toLocaleString('en-IN')}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(product) }}
                          disabled={(product.stock ?? 0) <= 0}
                          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${btnBg} border border-transparent disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
                        >
                          <ShoppingCart size={14} />
                          {(product.stock ?? 0) <= 0 ? 'Sold Out' : inCart ? `In Cart (${inCart.qty})` : 'Add'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (user?.role === 'manufacturer') {
                              navigate('/manufacturer/negotiation');
                            } else {
                              navigate(`/buyer/negotiation?manufacturer=${(product.manufacturer as any)._id || product.manufacturer}&product=${product._id}`);
                            }
                          }}
                          className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:border-[#F9D5B8] hover:text-[#5D4037] transition-all"                        >
                          <Handshake size={14} />
                          Negotiate
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="mt-16 bg-white border-t px-6 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <VyawanLogo size={24} />
            <p className="text-sm text-slate-500 mt-2">India's Premier B2B Marketplace</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-black text-slate-800 mb-3">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Catalog',      to: '/buyer/browse'       },
                { label: 'My Orders',    to: '/buyer/orders'       },
                { label: 'Tracking',     to: '/buyer/shipments'    },
                { label: 'Negotiation',  to: '/buyer/negotiation'  },
              ].map(({ label, to }) => (
                <li key={label}>
                  <button
                    onClick={() => navigate(to)}
                    className="text-sm text-slate-500 transition-colors hover:text-[#5D4037]"
                  >{label}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-black text-slate-800 mb-3">Support</h4>
            <ul className="space-y-2">
              {[
                { label: 'Help Center',       onClick: () => setHelpOpen(true) },
                { label: 'Contact Us',        onClick: () => setHelpOpen(true) },
                { label: 'Shipping Info',     to: '/buyer/shipments'  },
                { label: 'Returns & Refunds', to: '/buyer/orders'     },
              ].map(({ label, to, onClick }) => (
                <li key={label}>
                  <button
                    onClick={() => onClick ? onClick() : navigate(to!)}
                    className="text-sm text-slate-500 transition-colors hover:text-[#5D4037]"
                  >{label}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <div className="rounded-2xl p-5" style={{ background: '#FCE7D6' }}>
              <h4 className="text-sm font-black text-slate-800 mb-1">Stay Updated</h4>
              <p className="text-xs text-slate-500 mb-3">Get the latest deals and updates</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-white focus:outline-none"
                  style={{ border: '1px solid #F9D5B8' }}
                />
                <button className="px-3 py-2 rounded-xl text-white text-xs font-bold transition-colors"
                  style={{ background: '#5D4037' }}>
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t flex items-center justify-between">
          <p className="text-xs text-slate-400">© 2024 Vyawan. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {[Share2, AtSign, Camera].map((Icon, i) => (
              <button key={i} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-white transition-all"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#5D4037'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Cart Drawer ── */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setSelectedProduct(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-4xl max-h-[90vh] bg-white z-[70] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-md flex items-center justify-center text-slate-500 hover:text-slate-900 z-10 transition-all hover:scale-110"
              >
                ✕
              </button>

              {/* Product Layout */}
              <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                {/* Left: Media Area */}
                <div className="w-full md:w-[45%] bg-slate-50 relative overflow-hidden flex items-center justify-center min-h-[300px]">
                  {selectedProduct.image ? (
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={64} className="text-slate-200" />
                  )}
                  <div className="absolute bottom-6 left-6 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur text-[10px] font-black uppercase tracking-widest shadow-sm" style={{ color: '#5D4037' }}>
                      {selectedProduct.category}
                    </span>
                    {selectedProduct.sampleEnabled && (
                      <span className="px-3 py-1 rounded-full bg-green-500 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                        Samples Available
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Info Area */}
                <div className="flex-1 p-8 md:p-10 overflow-y-auto custom-scrollbar bg-white">
                  <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">{selectedProduct.name}</h2>
                    <p className="text-2xl font-black" style={{ color: '#5D4037' }}>₹{selectedProduct.price.toLocaleString('en-IN')}</p>
                  </div>

                  {/* Quick Specs Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="rounded-2xl p-4" style={{ background: '#FAF8F5', border: '1px solid #E5E1DA' }}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Minimum Order</p>
                      <p className="text-sm font-black text-slate-800">{selectedProduct.moq} {selectedProduct.unit}s</p>
                    </div>
                    <div className="rounded-2xl p-4" style={{ background: '#FAF8F5', border: '1px solid #E5E1DA' }}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Material</p>
                      <p className="text-sm font-black text-slate-800">{selectedProduct.material || 'Standard Grade'}</p>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="mb-8">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 pl-3" style={{ borderLeft: '4px solid #5D4037' }}>Description</h4>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      {selectedProduct.shortDescription || 'Crafted with premium materials and rigorous quality checks. Perfect for bulk retail and industrial supply chains.'}
                    </p>
                  </div>

                  {/* Bulk Slabs Table */}
                  {selectedProduct.bulkSlabs && selectedProduct.bulkSlabs.length > 0 && (
                    <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <ShoppingCart size={12} style={{ color: '#5D4037' }} /> Bulk Pricing Slabs
                      </h4>
                      <div className="space-y-3">
                        {selectedProduct.bulkSlabs.map((slab: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                            <span className="text-sm font-bold text-slate-600">
                              {slab.from}{slab.to ? ` - ${slab.to}` : '+'} units
                            </span>
                            <span className="text-sm font-black text-slate-900">₹{slab.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample & Payments */}
                  <div className="space-y-6 mb-10 text-xs">
                    {selectedProduct.sampleEnabled && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 font-black">S</div>
                        <div>
                          <p className="font-black text-slate-800">Sample Pricing: ₹{selectedProduct.samplePrice}</p>
                          <p className="text-slate-500">Max {selectedProduct.sampleMaxUnits} units</p>
                        </div>
                      </div>
                    )}
                    {selectedProduct.paymentTerms && selectedProduct.paymentTerms.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">✓</div>
                        <div>
                          <p className="font-black text-slate-800">Payment: {selectedProduct.paymentTerms.join(', ')}</p>
                          <p className="text-slate-500">{selectedProduct.paymentNotes || 'Standard industry payment terms apply.'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 sticky bottom-0 bg-white pt-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => { addToCart(selectedProduct); setSelectedProduct(null) }}
                        className="flex-1 py-4 rounded-2xl text-white font-black text-xs hover:scale-[1.02] active:scale-100 transition-all"
                        style={{ background: '#5D4037', boxShadow: '0 8px 24px rgba(93,64,55,0.25)' }}
                      >
                        Add to Bulk Order
                      </button>

                      <button
                        onClick={() => { buyNow(selectedProduct); setSelectedProduct(null) }}
                        className="flex-1 py-4 rounded-2xl bg-white border-2 border-[#5D4037] text-[#5D4037] font-black text-xs hover:scale-[1.02] active:scale-100 transition-all"
                      >
                        Buy Now
                      </button>
                    </div>

                    <div className="flex gap-3">
                      {selectedProduct.sampleEnabled && (
                        <button
                          onClick={() => { buyNow(selectedProduct, true); setSelectedProduct(null) }}
                          className="flex-1 py-4 rounded-2xl bg-green-600 text-white font-black text-xs shadow-lg shadow-green-600/20 hover:scale-[1.02] active:scale-100 transition-all flex flex-col items-center justify-center leading-tight"
                        >
                          <span>Order Sample</span>
                          <span className="text-[9px] opacity-90">₹{selectedProduct.samplePrice}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedProduct(null);
                          if (user?.role === 'manufacturer') {
                            navigate('/manufacturer/negotiation');
                          } else {
                            navigate(`/buyer/negotiation?manufacturer=${(selectedProduct.manufacturer as any)._id || selectedProduct.manufacturer}&product=${selectedProduct._id}`);
                          }
                        }}
                        className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-xs transition-all hover:border-[#5D4037] hover:text-[#5D4037]"
                      >
                        Negotiate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-96 bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-sp-border">
                <h3 className="font-black text-slate-900">Cart ({cartCount})</h3>
                <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
                    <ShoppingCart size={48} />
                    <p className="text-sm font-medium text-slate-400">Your cart is empty</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item.product._id} className="flex gap-3 items-center bg-sp-bg rounded-2xl p-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                      {item.product.image
                        ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        : <Package size={24} className="m-auto text-slate-300 mt-3" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-800 truncate">{item.product.name}</p>
                        {item.isSample && (
                          <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[8px] font-black uppercase">Sample</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-black flex-shrink-0" style={{ color: '#5D4037' }}>
                      ₹{((item.isSample ? item.product.samplePrice : (item.product.price ?? 0)) * item.qty).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t">
                  <div className="flex justify-between mb-4">
                    <span className="font-bold text-slate-700">Total</span>
                    <span className="font-black text-xl text-slate-900">
                      ₹{cart.reduce((s, i) => s + (i.isSample ? i.product.samplePrice : (i.product.price ?? 0)) * i.qty, 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => { setCartOpen(false); navigate('/buyer/checkout') }}
                    className="w-full py-3.5 rounded-2xl text-white font-black text-sm transition-colors"
                    style={{ background: '#5D4037' }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <HelpCenterModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} role="buyer" />
      <ProfileEditModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}





