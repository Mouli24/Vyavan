import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Truck, Handshake, ScanLine,
  Search, ChevronDown, Loader2,
  Share2, AtSign, Camera, ShoppingBag,
  User, Package, X, Check, BellOff,
  PhoneCall, MessageCircle, Home
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { api, Product, Notification as NotifType } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '@/components/NotificationBell'

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
  default:            'text-sp-purple',
}

const PILL_BG: Record<string, string> = {
  Electronics:        'bg-orange-50 border-orange-100',
  Textiles:           'bg-blue-50 border-blue-100',
  'Home & Furniture': 'bg-purple-50 border-purple-100',
  'Beauty & Personal Care': 'bg-pink-50 border-pink-100',
  default:            'bg-sp-purple-pale border-sp-purple/10',
}

const ADD_BTN_BG: Record<string, string> = {
  Electronics:        'bg-orange-100 hover:bg-orange-200 text-orange-700',
  Textiles:           'bg-blue-100 hover:bg-blue-200 text-blue-700',
  'Home & Furniture': 'bg-purple-100 hover:bg-purple-200 text-purple-700',
  'Beauty & Personal Care': 'bg-pink-100 hover:bg-pink-200 text-pink-700',
  default:            'bg-sp-purple-pale hover:bg-sp-purple/20 text-sp-purple',
}

const SORT_OPTIONS = ['Popular', 'Price: Low to High', 'Price: High to Low', 'Newest']

const FEATURE_PILLS = [
  { icon: ShoppingCart, label: '1,250+',          sub: 'Products Available',  bg: 'bg-orange-50',  iconColor: 'text-orange-500',  to: '/buyer/browse'     },
  { icon: Truck,        label: 'Fast & Reliable',  sub: 'Shipping',            bg: 'bg-blue-50',    iconColor: 'text-blue-500',    to: '/buyer/shipments'  },
  { icon: Handshake,    label: 'Safe Negotiation', sub: 'with Suppliers',      bg: 'bg-purple-50',  iconColor: 'text-purple-500',  to: '/buyer/dashboard'  },
  { icon: ScanLine,     label: 'Track Orders',     sub: 'in Real Time',        bg: 'bg-pink-50',    iconColor: 'text-pink-500',    to: '/buyer/orders'     },
]

interface CartItem { product: Product; qty: number }

export default function BuyerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Popular')
  const [sortOpen, setSortOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Fetch Products
    api.getProducts()
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
  }, [])

  const addToCart = async (product: Product) => {
    try {
      const res = await api.addToCart(product._id, 1);
      if (res && res.items) {
        setCart(res.items.map((i: any) => ({ product: i.product, qty: i.quantity })))
      }
    } catch (e) {
      console.error(e)
    }
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
    <div className="min-h-screen" style={{ background: '#FDF6EE', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F0E6D8] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <h1
            className="text-2xl font-black text-slate-900 cursor-pointer flex-shrink-0"
            onClick={() => navigate('/buyer/browse')}
          >
            Sephio
          </h1>

          {/* Nav pills */}
          <nav className="hidden md:flex items-center gap-2">
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
                    ? 'bg-[#FFF0E0] border-[#F5C89A] text-[#C47A2B]'
                    : 'bg-white border-[#EEE] text-slate-600 hover:border-[#F5C89A] hover:text-[#C47A2B]'
                }`}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Cart */}
            <button
              onClick={() => setCartOpen(o => !o)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-[#EEE] bg-white text-slate-700 text-sm font-semibold hover:border-[#F5C89A] transition-all"
            >
              <ShoppingCart size={16} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C47A2B] text-white text-[10px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Account */}
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#EEE] bg-white text-slate-700 text-sm font-semibold hover:border-[#F5C89A] transition-all"
            >
              <User size={15} />
              {user ? user.name?.split(' ')[0] : 'My Account'}
              <ChevronDown size={13} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Hero Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #FFF5E8 0%, #FDE8D0 100%)', border: '1px solid #F5D9B8' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-10 py-8 sm:py-10 gap-6">
            <div className="max-w-md">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#F5C89A]/60 text-[#A0621A] mb-4">
                Welcome Back!
              </span>
              <h2 className="text-4xl font-black text-slate-900 leading-tight mb-3">
                Discover Quality Products<br />from Trusted Suppliers
              </h2>
              <p className="text-slate-500 text-sm mb-6">Browse, negotiate, and buy with confidence.</p>
              <button
                onClick={() => navigate('/buyer/browse')}
                className="px-7 py-3 rounded-full font-bold text-sm text-slate-800 border-2 border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
              >
                Explore Catalog
              </button>
            </div>

            {/* Illustration */}
            <div className="hidden md:flex items-end gap-3 pr-4">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#C8B4F8] to-[#A78BFA] flex items-center justify-center shadow-xl">
                  <ShoppingBag size={48} className="text-white" />
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.3 }}
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#93C5FD] to-[#60A5FA] flex items-center justify-center shadow-lg">
                  <Package size={36} className="text-white" />
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 0.6 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FCA5A5] to-[#F87171] flex items-center justify-center shadow-md">
                  <Truck size={28} className="text-white" />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ── Feature Pills ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURE_PILLS.map((pill, i) => (
            <motion.div
              key={pill.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => navigate(pill.to)}
              className={`${pill.bg} rounded-2xl px-5 py-4 flex items-center gap-4 border border-white/60 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all`}
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <pill.icon size={20} className={pill.iconColor} />
              </div>
              <div>
                <p className="font-black text-slate-800 text-sm leading-tight">{pill.label}</p>
                <p className="text-xs text-slate-500">{pill.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Featured Products ── */}
        <div className="mt-12">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black text-slate-900">Featured Products</h3>
            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#EEE] bg-white text-sm text-slate-600 font-medium hover:border-[#F5C89A] transition-all"
              >
                Sort: {sort} <ChevronDown size={13} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-[#EEE] overflow-hidden z-20 w-48"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setSort(opt); setSortOpen(false) }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${sort === opt ? 'bg-[#FFF0E0] text-[#C47A2B] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
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
              className="w-full pl-12 pr-5 py-3.5 rounded-2xl border border-[#EEE] bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#F5C89A] focus:ring-2 focus:ring-[#F5C89A]/20 shadow-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-[#C47A2B]" />
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
                    className="bg-white rounded-[1.5rem] overflow-hidden border border-[#F0E6D8] hover:shadow-lg hover:-translate-y-1 transition-all group"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
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
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className={`text-xs font-bold mb-1 ${catColor}`}>{cat}</p>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight mb-2 line-clamp-2">{product.name}</h4>
                      <p className="text-base font-black text-slate-900 mb-3">
                        ₹{(product.price ?? 0).toLocaleString('en-IN')}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                          onClick={() => addToCart(product)}
                          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${btnBg} border border-transparent`}
                        >
                          <ShoppingCart size={14} />
                          {inCart ? `In Cart (${inCart.qty})` : 'Add'}
                        </button>
                        <button
                          onClick={() => {
                            if (user?.role === 'manufacturer') {
                              navigate('/manufacturer/negotiation');
                            } else {
                              navigate(`/buyer/negotiation?manufacturer=${(product.manufacturer as any)._id || product.manufacturer}&product=${product._id}`);
                            }
                          }}
                          className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:border-sp-purple hover:text-sp-purple transition-all"
                        >
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
      <footer className="mt-16 bg-white border-t border-[#F0E6D8] px-6 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Sephio</h2>
            <p className="text-sm text-slate-500">Your Trusted B2B Shopping Partner</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-black text-slate-800 mb-3">Quick Links</h4>
            <ul className="space-y-2">
              {['Catalog', 'My Orders', 'Tracking', 'Negotiation'].map(l => (
                <li key={l}>
                  <button className="text-sm text-slate-500 hover:text-[#C47A2B] transition-colors">{l}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-black text-slate-800 mb-3">Support</h4>
            <ul className="space-y-2">
              {['Help Center', 'Contact Us', 'Shipping Info', 'Returns & Refunds'].map(l => (
                <li key={l}>
                  <button className="text-sm text-slate-500 hover:text-[#C47A2B] transition-colors">{l}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <div className="bg-[#EDE9FE] rounded-2xl p-5">
              <h4 className="text-sm font-black text-slate-800 mb-1">Stay Updated</h4>
              <p className="text-xs text-slate-500 mb-3">Get the latest deals and updates</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 rounded-xl text-xs border border-[#D8D0F8] bg-white focus:outline-none focus:border-[#A78BFA]"
                />
                <button className="px-3 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#F0E6D8] flex items-center justify-between">
          <p className="text-xs text-slate-400">© 2024 Sephio. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {[Share2, AtSign, Camera].map((Icon, i) => (
              <button key={i} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-[#C47A2B] hover:text-white transition-all">
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Cart Drawer ── */}
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
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0E6D8]">
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
                  <div key={item.product._id} className="flex gap-3 items-center bg-[#FDF6EE] rounded-2xl p-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                      {item.product.image
                        ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        : <Package size={24} className="m-auto text-slate-300 mt-3" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-black text-[#C47A2B] flex-shrink-0">
                      ₹{((item.product.price ?? 0) * item.qty).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-[#F0E6D8]">
                  <div className="flex justify-between mb-4">
                    <span className="font-bold text-slate-700">Total</span>
                    <span className="font-black text-xl text-slate-900">
                      ₹{cart.reduce((s, i) => s + (i.product.price ?? 0) * i.qty, 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => { setCartOpen(false); navigate('/buyer/checkout') }}
                    className="w-full py-3.5 rounded-2xl bg-[#C47A2B] text-white font-black text-sm hover:bg-[#A0621A] transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
