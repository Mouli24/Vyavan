import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Bell, ShoppingCart, Star, MapPin, ChevronRight,
  Factory, Shield, Zap, TrendingUp, Package, Users,
  CheckCircle, ArrowRight, Globe, Headphones, Award,
  BarChart2, ShoppingBag, MessageCircle
} from 'lucide-react'

const CATEGORIES = [
  { name: 'Textiles', icon: '🧵', count: '320+' },
  { name: 'Electronics', icon: '⚡', count: '180+' },
  { name: 'Machinery', icon: '⚙️', count: '240+' },
  { name: 'FMCG', icon: '🛒', count: '150+' },
  { name: 'Automotive', icon: '🚗', count: '90+' },
  { name: 'Construction', icon: '🏗️', count: '110+' },
  { name: 'Chemicals', icon: '🧪', count: '75+' },
  { name: 'Agriculture', icon: '🌾', count: '130+' },
]

const FEATURED_PRODUCTS = [
  {
    id: '1',
    name: 'Premium Cotton T-Shirts',
    manufacturer: 'Sharma Textiles',
    location: 'Mumbai, India',
    price: 160,
    moq: 200,
    rating: 4.8,
    reviews: 124,
    verified: true,
    category: 'Textiles',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
    badge: 'Top Seller',
    badgeColor: 'bg-sp-purple text-white',
  },
  {
    id: '2',
    name: 'Ceramic Office Vase',
    manufacturer: 'Pune Ceramics',
    location: 'Pune, India',
    price: 450,
    moq: 50,
    rating: 4.6,
    reviews: 87,
    verified: true,
    category: 'Home Décor',
    image: 'https://images.unsplash.com/photo-1612198189090-a5dde3d33c12?w=300&h=300&fit=crop',
    badge: 'New',
    badgeColor: 'bg-sp-success text-white',
  },
  {
    id: '3',
    name: 'Twill Sports Cap',
    manufacturer: 'Delhi Accessories',
    location: 'Delhi, India',
    price: 85,
    moq: 500,
    rating: 4.9,
    reviews: 203,
    verified: true,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&h=300&fit=crop',
    badge: 'Best Price',
    badgeColor: 'bg-amber-500 text-white',
  },
  {
    id: '4',
    name: 'Walnut Office Desk',
    manufacturer: 'Rajasthan Woodcraft',
    location: 'Jaipur, India',
    price: 12500,
    moq: 10,
    rating: 4.7,
    reviews: 56,
    verified: false,
    category: 'Furniture',
    image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=300&h=300&fit=crop',
    badge: null,
    badgeColor: '',
  },
]

const STATS = [
  { label: 'Manufacturers', value: '1,250+', icon: Factory, color: 'bg-sp-purple-light text-sp-purple', bg: 'bg-sp-purple-pale' },
  { label: 'Fast & Reliable Prices', value: 'Negotiable', icon: Zap, color: 'bg-sp-mint text-sp-success', bg: 'bg-sp-mint' },
  { label: 'Negotiations', value: '400+', icon: MessageCircle, color: 'bg-sp-peach text-amber-600', bg: 'bg-sp-peach' },
  { label: 'Trusted Orders', value: '12,000+', icon: Shield, color: 'bg-sp-sky text-sp-info', bg: 'bg-sp-sky' },
]

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    company: 'TechRetail India',
    role: 'Procurement Head',
    text: 'The negotiation module saved us 23% on bulk orders. The verified manufacturer badge gives us complete confidence.',
    rating: 5,
    avatar: 'PS',
    avatarColor: 'bg-purple-100 text-purple-700',
  },
  {
    name: 'James Nordic',
    company: 'EuroTrade GmbH',
    role: 'Operations Director',
    text: 'Found 3 reliable manufacturers within a week. The structured RFQ process is far better than endless WhatsApp chats.',
    rating: 5,
    avatar: 'JN',
    avatarColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Sarah Chen',
    company: 'Pacific Imports',
    role: 'CEO',
    text: 'Real-time order tracking and complaint resolution makes this platform indispensable for our business.',
    rating: 5,
    avatar: 'SC',
    avatarColor: 'bg-green-100 text-green-700',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount] = useState(0)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-sp-bg font-sans">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-sp-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-8 h-8 rounded-lg gradient-card-purple flex items-center justify-center">
                  <Factory className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-sp-purple">B2BHarat</span>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                {['Catalog', 'Trending', 'Insights', 'Negotiations'].map((item) => (
                  <button
                    key={item}
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-sm font-medium text-sp-muted hover:text-sp-purple hover:bg-sp-purple-pale rounded-lg transition-all"
                  >
                    {item}
                  </button>
                ))}
              </nav>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-placeholder" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products, manufacturers..."
                  className="w-full pl-10 pr-4 py-2.5 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sp-purple/20 focus:border-sp-purple transition-all"
                />
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-sp-muted hover:text-sp-purple hover:bg-sp-purple-pale rounded-lg transition-all">
                <Bell className="w-5 h-5" />
              </button>
              <button className="relative p-2 text-sp-muted hover:text-sp-purple hover:bg-sp-purple-pale rounded-lg transition-all">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-sp-purple text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sp-muted hover:text-sp-purple border border-sp-border hover:border-sp-purple rounded-xl transition-all"
              >
                My Account
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white gradient-card-purple rounded-xl hover:opacity-90 transition-all shadow-sm"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="gradient-hero py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sp-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sp-success/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sp-purple-pale border border-sp-purple/20 rounded-full text-sm font-medium text-sp-purple mb-6">
                <Zap className="w-3.5 h-3.5" />
                India's Premier B2B Marketplace
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-sp-text leading-tight mb-6">
                Discover Quality Products
                <span className="block text-sp-purple">from Trusted Suppliers</span>
              </h1>
              <p className="text-lg text-sp-muted max-w-lg mb-8 leading-relaxed">
                Connect directly with verified manufacturers. Negotiate pricing, place bulk orders, and track everything in real-time — all in one platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 px-8 py-4 gradient-card-purple text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-purple text-sm"
                >
                  Start Sourcing
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-sp-text font-bold rounded-2xl border border-sp-border hover:border-sp-purple hover:text-sp-purple transition-all text-sm shadow-card"
                >
                  <Factory className="w-4 h-4" />
                  List Your Business
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 mt-10 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-sm text-sp-muted">
                  <CheckCircle className="w-4 h-4 text-sp-success" />
                  GST Verified
                </div>
                <div className="flex items-center gap-2 text-sm text-sp-muted">
                  <CheckCircle className="w-4 h-4 text-sp-success" />
                  Secure Payments
                </div>
                <div className="flex items-center gap-2 text-sm text-sp-muted">
                  <CheckCircle className="w-4 h-4 text-sp-success" />
                  Real-time Tracking
                </div>
              </div>
            </div>

            {/* Hero illustration */}
            <div className="flex-shrink-0 relative">
              <div className="w-80 h-80 lg:w-96 lg:h-96 bg-white rounded-3xl shadow-card p-6 relative">
                {/* Floating cards */}
                <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-card p-3 flex items-center gap-2 border border-sp-border">
                  <div className="w-8 h-8 gradient-card-green rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sp-text">Order Confirmed</p>
                    <p className="text-[10px] text-sp-muted">₹2,40,000</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-card p-3 flex items-center gap-2 border border-sp-border">
                  <div className="w-8 h-8 gradient-card-orange rounded-lg flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sp-text">Negotiations</p>
                    <p className="text-[10px] text-sp-muted">23 active</p>
                  </div>
                </div>
                {/* Main illustration */}
                <div className="w-full h-full gradient-hero rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 gradient-card-purple rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-purple">
                      <ShoppingBag className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm font-bold text-sp-text">B2B Marketplace</p>
                    <p className="text-xs text-sp-muted mt-1">Factory → Business</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Row ── */}
      <section className="bg-white border-y border-sp-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 flex items-center gap-4`}>
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-sp-text">{stat.value}</p>
                  <p className="text-xs text-sp-muted font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-sp-text">Browse by Category</h2>
              <p className="text-sp-muted text-sm mt-1">Find the perfect manufacturer for your needs</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-sp-purple hover:underline"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => navigate('/login')}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-sp-border hover:border-sp-purple hover:shadow-hover transition-all group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-semibold text-sp-text">{cat.name}</span>
                <span className="text-[10px] text-sp-muted bg-sp-bg px-2 py-0.5 rounded-full">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-sp-text">Featured Products</h2>
              <p className="text-sp-muted text-sm mt-1">Handpicked from top verified manufacturers</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-sp-purple hover:underline"
            >
              View all products <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="bg-sp-bg rounded-2xl overflow-hidden border border-sp-border hover:border-sp-purple/30 hover:shadow-hover transition-all group cursor-pointer"
                onClick={() => navigate('/login')}
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-white">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/300x300/EDE9FE/7C3AED?text=${encodeURIComponent(product.name[0])}`
                    }}
                  />
                  {product.badge && (
                    <span className={`absolute top-3 left-3 ${product.badgeColor} text-[10px] font-bold px-2.5 py-1 rounded-full`}>
                      {product.badge}
                    </span>
                  )}
                  {product.verified && (
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-sp-success text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-[10px] text-sp-muted font-medium uppercase tracking-wider mb-1">{product.category}</p>
                  <h3 className="font-bold text-sp-text text-sm mb-1 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3 text-sp-muted" />
                    <span className="text-xs text-sp-muted">{product.manufacturer} · {product.location}</span>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-sp-text">{product.rating}</span>
                    <span className="text-xs text-sp-muted">({product.reviews})</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-sp-border">
                    <div>
                      <span className="text-lg font-extrabold text-sp-purple">₹{product.price.toLocaleString()}</span>
                      <span className="text-[10px] text-sp-muted"> /piece</span>
                      <p className="text-[10px] text-sp-muted">MOQ: {product.moq} pcs</p>
                    </div>
                    <button className="p-2 gradient-card-purple text-white rounded-xl hover:opacity-90 transition-all">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-hero">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-sp-text mb-3">How It Works</h2>
          <p className="text-sp-muted mb-16 max-w-xl mx-auto">From discovery to delivery — a streamlined B2B procurement experience</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', icon: Search, title: 'Discover', desc: 'Browse verified manufacturers and products by category, location, or keyword.' },
              { step: '02', icon: MessageCircle, title: 'Negotiate', desc: 'Use structured negotiation rounds — no WhatsApp chaos. Up to 5 rounds, 48h per round.' },
              { step: '03', icon: Package, title: 'Order', desc: 'Place bulk orders with MOQ enforcement and automatic pricing slab calculation.' },
              { step: '04', icon: TrendingUp, title: 'Track', desc: 'Real-time shipment tracking with courier integration and invoice management.' },
            ].map((step) => (
              <div key={step.step} className="relative">
                <div className="bg-white rounded-3xl p-6 shadow-card border border-sp-border text-left h-full">
                  <div className="text-4xl font-black text-sp-border mb-4">{step.step}</div>
                  <div className="w-10 h-10 gradient-card-purple rounded-xl flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sp-text mb-2">{step.title}</h3>
                  <p className="text-sm text-sp-muted leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-sp-text mb-4">
                Everything you need for<br />
                <span className="text-sp-purple">successful B2B procurement</span>
              </h2>
              <p className="text-sp-muted mb-8 leading-relaxed">
                From manufacturer verification to complaint resolution — a complete ecosystem for factory-to-business trade.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Shield, title: 'Verified Manufacturers', desc: 'GST, PAN, MSME verification with admin review' },
                  { icon: MessageCircle, title: 'Structured Negotiation', desc: '5 rounds with 48h expiry, counter-offer support' },
                  { icon: BarChart2, title: 'Analytics Dashboard', desc: 'Revenue, order stats, top products insights' },
                  { icon: Headphones, title: '24/7 Complaint System', desc: 'Raise, respond, escalate disputes with evidence' },
                  { icon: Globe, title: 'Schedule Calls', desc: 'Book slots with manufacturer availability' },
                  { icon: Award, title: 'Admin Controls', desc: 'Platform-level approval, verification, dispute resolution' },
                ].map((feat) => (
                  <div key={feat.title} className="flex gap-3 p-4 bg-sp-bg rounded-xl border border-sp-border">
                    <div className="w-8 h-8 bg-sp-purple-pale text-sp-purple rounded-lg flex items-center justify-center flex-shrink-0">
                      <feat.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-sp-text">{feat.title}</h4>
                      <p className="text-xs text-sp-muted mt-0.5">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="gradient-card-purple rounded-3xl p-6 text-white">
                <Users className="w-8 h-8 mb-4 opacity-80" />
                <p className="text-3xl font-black">1,250+</p>
                <p className="text-sm opacity-80 mt-1">Active Manufacturers</p>
              </div>
              <div className="bg-sp-mint rounded-3xl p-6">
                <TrendingUp className="w-8 h-8 text-sp-success mb-4" />
                <p className="text-3xl font-black text-sp-text">98%</p>
                <p className="text-sm text-sp-muted mt-1">Order Fulfillment</p>
              </div>
              <div className="bg-sp-peach rounded-3xl p-6">
                <Package className="w-8 h-8 text-amber-600 mb-4" />
                <p className="text-3xl font-black text-sp-text">12K+</p>
                <p className="text-sm text-sp-muted mt-1">Orders Placed</p>
              </div>
              <div className="gradient-card-blue rounded-3xl p-6 text-white">
                <Shield className="w-8 h-8 mb-4 opacity-80" />
                <p className="text-3xl font-black">100%</p>
                <p className="text-sm opacity-80 mt-1">Secure Transactions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-sp-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-sp-text mb-3">What our buyers say</h2>
            <p className="text-sp-muted">Join thousands of businesses sourcing smarter</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-sp-border shadow-card">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sp-text text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.avatarColor} rounded-full flex items-center justify-center text-sm font-bold`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-sp-text">{t.name}</p>
                    <p className="text-xs text-sp-muted">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-card-purple text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to transform your procurement?
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Join 1,250+ manufacturers and thousands of buyers on India's leading B2B marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-sp-purple font-bold rounded-2xl hover:bg-white/90 transition-all shadow-lg text-sm"
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-sm"
            >
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-sp-border py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-card-purple flex items-center justify-center">
                  <Factory className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-sp-purple">B2BHarat</span>
              </div>
              <p className="text-sm text-sp-muted leading-relaxed max-w-xs">
                India's premier factory-to-business marketplace. Connecting verified manufacturers with global buyers.
              </p>
              <div className="flex items-center gap-3 mt-6">
                {['GST Verified', 'MSME Partner', 'Secure Pay'].map(b => (
                  <span key={b} className="text-[10px] font-medium text-sp-muted bg-sp-bg border border-sp-border px-2 py-1 rounded-full">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {[
              { title: 'Platform', links: ['Catalog', 'Trending', 'Negotiations', 'Analytics'] },
              { title: 'For Buyers', links: ['Browse Suppliers', 'Place Orders', 'Track Shipments', 'File Complaints'] },
              { title: 'For Manufacturers', links: ['List Products', 'Manage Orders', 'Payment Reports', 'Onboarding Guide'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-sp-text text-sm mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link}>
                      <button
                        onClick={() => navigate('/login')}
                        className="text-sm text-sp-muted hover:text-sp-purple transition-colors"
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-sp-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-sp-muted">© 2026 B2BHarat. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(link => (
                <button key={link} className="text-sm text-sp-muted hover:text-sp-purple transition-colors">
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
