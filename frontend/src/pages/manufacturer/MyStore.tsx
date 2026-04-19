import {
  Plus, Edit3, Star, Image as ImageIcon, Trash2,
  MessageSquare, Zap, Store, Package, Truck,
  ArrowRight, Loader2, Sparkles, Bell, MapPin,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import AddProductModal from '@/features/manufacturer/AddProductModal'
import { api, Product } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

export default function MyStore() {
  const navigate = useNavigate()
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [onboardingPlan, setOnboardingPlan] = useState<any>(null)
  const [loadingOnboarding, setLoadingOnboarding] = useState(true)

  const fetchProducts = () => {
    setLoadingProducts(true)
    api.getMyProducts()
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }

  useEffect(() => {
    fetchProducts()
    api.getOnboardingAdvice()
      .then(plan => setOnboardingPlan(plan))
      .catch(() => {})
      .finally(() => setLoadingOnboarding(false))
  }, [])

  const handleEdit = (product: Product) => { setEditProduct(product); setShowAddProduct(true) }
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeletingId(id)
    try { await api.deleteProduct(id); setProducts(prev => prev.filter(p => p._id !== id)) }
    catch (e) { console.error(e) }
    finally { setDeletingId(null) }
  }
  const handleModalClose = () => { setShowAddProduct(false); setEditProduct(null) }
  const handlePublished = () => { handleModalClose(); fetchProducts() }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#FAF8F5' }}>
      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Store</h1>
            <p className="text-sm text-slate-500 mt-1">
              Your store's performance overview and product management.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all shadow-sm"
            >
              <Edit3 size={15} /> Customize Storefront
            </button>
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
              style={{ background: '#5D4037' }}
            >
              <Plus size={15} /> New Product
            </button>
          </div>
        </div>

        {/* ── Top 3 stat cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Onboarding / Setup card */}
          <div className="rounded-2xl p-6 flex flex-col justify-between min-h-[160px]"
            style={{ background: '#FCE7D6', border: '1px solid #F9D5B8' }}>
            {loadingOnboarding ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#5D4037' }} />
              </div>
            ) : onboardingPlan ? (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                      style={{ background: 'rgba(93,64,55,0.12)', color: '#5D4037' }}>
                      <Sparkles size={9} /> Agent Guidance
                    </span>
                    <span className="text-xs font-bold" style={{ color: '#5D4037' }}>
                      {onboardingPlan.completion_percentage}% Complete
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-1 leading-tight" style={{ color: '#3E2723' }}>
                    {onboardingPlan.next_action?.title || onboardingPlan.headline_message}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#6D4C41' }}>
                    {onboardingPlan.next_action?.description || onboardingPlan.agent_advice}
                  </p>
                </div>
                <div className="mt-4">
                  <div className="w-full h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(93,64,55,0.15)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${onboardingPlan.completion_percentage}%` }}
                      transition={{ duration: 1, delay: 0.2 }} className="h-full rounded-full" style={{ background: '#5D4037' }} />
                  </div>
                  <button onClick={() => navigate(onboardingPlan.next_action?.redirect_url || '/manufacturer/settings')}
                    className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#5D4037' }}>
                    {onboardingPlan.next_action?.action_button || 'Continue Setup'} <ArrowRight size={12} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: 'rgba(93,64,55,0.12)', color: '#5D4037' }}>Active Store</span>
                  <span className="text-xs font-bold" style={{ color: '#5D4037' }}>100% Complete</span>
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: '#3E2723' }}>Profile Built!</h3>
                <p className="text-xs" style={{ color: '#6D4C41' }}>Your profile is fully set up. Ready to receive orders!</p>
                <div className="w-full h-1.5 rounded-full overflow-hidden mt-4" style={{ background: 'rgba(93,64,55,0.15)' }}>
                  <div className="w-full h-full rounded-full" style={{ background: '#5D4037' }} />
                </div>
              </>
            )}
          </div>

          {/* Store Rating */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-widest mb-3">Store Rating</p>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-5xl font-bold text-slate-900 tracking-tight">4.8</span>
              <div className="flex" style={{ color: '#5D4037' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
            </div>
            <p className="text-sm text-slate-400">
              <span className="text-green-600 font-semibold">+12%</span> from last month's reviews
            </p>
          </div>

          {/* Inventory Depth */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-widest mb-3">Inventory Depth</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-bold text-slate-900 tracking-tight">{products.length || 124}</span>
              <span className="text-lg text-slate-400 font-medium">SKUs</span>
            </div>
            <p className="text-sm text-slate-400">Active products across 5 categories</p>
          </div>
        </div>

        {/* ── AI Image Studio Banner ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 flex items-center gap-8">
          <div className="relative w-56 h-36 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
            <img src="https://picsum.photos/seed/industrial/600/400" alt="AI Enhanced"
              className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Zap size={10} className="text-white fill-white" />
              <span className="text-[9px] text-white font-bold uppercase tracking-wider">AI Enhanced</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">AI Image Studio</h2>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed max-w-lg">
              Instantly enhance your product catalog photos. Our AI adjusts lighting, removes backgrounds, and sharpens textures to industrial-grade standards.
            </p>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: '#1E293B' }}>
                Launch Studio
              </button>
              <button className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                Bulk Auto-Enhance
              </button>
            </div>
          </div>
        </div>

        {/* ── Main 2-col: Products + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Product Management */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900">Product Management</h2>
              <button className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                View Full Catalog <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={22} className="animate-spin" style={{ color: '#5D4037' }} />
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                  <ImageIcon size={32} />
                  <p className="text-sm font-medium">No products yet. Add your first product!</p>
                  <button onClick={() => setShowAddProduct(true)}
                    className="mt-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: '#5D4037' }}>
                    Add Product
                  </button>
                </div>
              ) : products.map((product) => (
                <div key={product._id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden flex-shrink-0"
                    style={{ background: '#F5E6D3' }}>
                    {product.image
                      ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      : <ImageIcon size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 text-sm truncate">{product.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {product.category ?? '—'} · MOQ: {product.moq} {product.unit}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 px-4">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-0.5">Base Price</p>
                    <p className="text-sm font-bold text-slate-800">₹{product.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(product)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                      title="Edit">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDelete(product._id)} disabled={deletingId === product._id}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title="Delete">
                      {deletingId === product._id
                        ? <Loader2 size={15} className="animate-spin" />
                        : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar widgets */}
          <div className="flex flex-col gap-5">

            {/* Active Campaigns */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Active Campaigns</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 relative overflow-hidden">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#FCE7D6', color: '#5D4037' }}>
                    <Bell size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800">Monsoon Bulk Sale</h4>
                    <p className="text-[10px] text-slate-400">Ends in 4 days</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded uppercase flex-shrink-0">Live</span>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 opacity-60">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                    <Zap size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-500">Early Bird 2025</h4>
                    <p className="text-[10px] text-slate-400">Starts next month</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-bold rounded uppercase flex-shrink-0">Scheduled</span>
                </div>
              </div>
            </div>

            {/* Delivery Hubs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin size={14} style={{ color: '#5D4037' }} /> Delivery Hubs
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Maharashtra', 'Gujarat', 'Tamil Nadu', 'Karnataka', '+8 more'].map((hub, idx) => (
                  <span key={idx}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      hub.startsWith('+') ? 'text-slate-400 hover:text-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {hub}
                  </span>
                ))}
              </div>
            </div>

            {/* Logistics */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Logistics Channels</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Truck, label: 'Road Freight' },
                  { icon: Package, label: 'Rail Network' },
                  { icon: Zap, label: 'Air Cargo' },
                  { icon: Store, label: 'Self Pickup' },
                ].map((item, idx) => (
                  <div key={idx}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: '#FCE7D6', color: '#5D4037' }}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 text-center">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      <AddProductModal
        open={showAddProduct}
        onClose={handleModalClose}
        onPublished={handlePublished}
        editProduct={editProduct}
      />
    </div>
  )
}
