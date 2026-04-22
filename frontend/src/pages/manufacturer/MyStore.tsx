import {
  Plus, Edit3, Star, Image as ImageIcon, Trash2,
  MessageSquare, Zap, Store, Package, Truck,
  ArrowRight, Loader2, Sparkles, Bell, MapPin,
  X, Calendar, Tag, Percent, Clock,
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import AddProductModal from '@/features/manufacturer/AddProductModal'
import { api, Product } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// ── Campaign types ────────────────────────────────────────────────────────────
interface Campaign {
  id: string
  name: string
  description: string
  discountType: 'percent' | 'flat'
  discountValue: number
  startDate: string
  endDate: string
  status: 'live' | 'scheduled' | 'ended'
  manufacturerId: string
  manufacturerName: string
}

const CAMPAIGNS_KEY = 'vyawan_campaigns'

function loadCampaigns(): Campaign[] {
  try { return JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) || '[]') } catch { return [] }
}
function saveCampaigns(c: Campaign[]) {
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(c))
}
function computeStatus(c: Campaign): Campaign['status'] {
  const now = new Date()
  const start = new Date(c.startDate)
  const end = new Date(c.endDate)
  if (now < start) return 'scheduled'
  if (now > end) return 'ended'
  return 'live'
}

// ── Add Campaign Modal ────────────────────────────────────────────────────────
function AddCampaignModal({ open, onClose, onSave, manufacturerId, manufacturerName }: {
  open: boolean; onClose: () => void
  onSave: (c: Campaign) => void
  manufacturerId: string; manufacturerName: string
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const reset = () => { setName(''); setDescription(''); setDiscountType('percent'); setDiscountValue(''); setStartDate(''); setEndDate('') }

  const handleSave = () => {
    if (!name || !discountValue || !startDate || !endDate) return
    const c: Campaign = {
      id: Date.now().toString(),
      name, description,
      discountType, discountValue: Number(discountValue),
      startDate, endDate,
      status: 'scheduled',
      manufacturerId, manufacturerName,
    }
    c.status = computeStatus(c)
    onSave(c)
    reset()
    onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FCE7D6' }}>
              <Tag size={16} style={{ color: '#5D4037' }} />
            </div>
            <h2 className="text-base font-bold text-slate-900">Create Campaign</h2>
          </div>
          <button onClick={() => { reset(); onClose() }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Campaign Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monsoon Bulk Sale"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#6B4E3D] transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="What's this sale about?"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#6B4E3D] transition-all resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Discount Type *</label>
              <select value={discountType} onChange={e => setDiscountType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#6B4E3D] transition-all">
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Value * {discountType === 'percent' ? '(%)' : '(₹)'}
              </label>
              <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '10' : '500'} min={1}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#6B4E3D] transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Start Date *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#6B4E3D] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">End Date *</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#6B4E3D] transition-all" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={() => { reset(); onClose() }}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!name || !discountValue || !startDate || !endDate}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: '#5D4037' }}>
            Launch Campaign
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function MyStore() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [onboardingPlan, setOnboardingPlan] = useState<any>(null)
  const [loadingOnboarding, setLoadingOnboarding] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [showAddCampaign, setShowAddCampaign] = useState(false)

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
    // Load campaigns from localStorage, filter by this manufacturer
    const all = loadCampaigns()
    const mine = all.filter(c => c.manufacturerId === (user?._id || 'local'))
      .map(c => ({ ...c, status: computeStatus(c) }))
    setCampaigns(mine)
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

  const handleAddCampaign = (c: Campaign) => {
    const all = loadCampaigns()
    const updated = [...all, c]
    saveCampaigns(updated)
    setCampaigns(prev => [...prev, c])
  }

  const handleDeleteCampaign = (id: string) => {
    const all = loadCampaigns().filter(c => c.id !== id)
    saveCampaigns(all)
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Active Campaigns</h3>
                <button onClick={() => setShowAddCampaign(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-90"
                  style={{ background: '#5D4037' }} title="Add Campaign">
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {campaigns.length === 0 ? (
                  <div className="text-center py-6">
                    <Tag size={24} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs text-slate-400">No campaigns yet</p>
                    <button onClick={() => setShowAddCampaign(true)}
                      className="mt-2 text-xs font-semibold" style={{ color: '#5D4037' }}>
                      + Create your first sale
                    </button>
                  </div>
                ) : campaigns.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: c.status === 'live' ? '#FCE7D6' : '#F5F2ED', color: c.status === 'live' ? '#5D4037' : '#A89F91' }}>
                      {c.discountType === 'percent' ? <Percent size={15} /> : <Tag size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800 truncate">{c.name}</h4>
                      <p className="text-[10px] text-slate-400">
                        {c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                        {' · '}
                        {new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded uppercase"
                        style={{
                          background: c.status === 'live' ? '#ECFDF5' : c.status === 'scheduled' ? '#FFF7ED' : '#F5F2ED',
                          color: c.status === 'live' ? '#059669' : c.status === 'scheduled' ? '#D97706' : '#A89F91',
                        }}>
                        {c.status}
                      </span>
                      <button onClick={() => handleDeleteCampaign(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-300 hover:text-red-400 transition-all">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Hubs */}
            {(() => {
              const ALL_HUBS = [
                'Maharashtra', 'Gujarat', 'Tamil Nadu', 'Karnataka', 'Delhi',
                'Uttar Pradesh', 'Rajasthan', 'West Bengal', 'Telangana', 'Andhra Pradesh',
                'Madhya Pradesh', 'Kerala', 'Punjab', 'Haryana', 'Bihar',
                'Odisha', 'Jharkhand', 'Chhattisgarh', 'Assam', 'Himachal Pradesh',
                'Uttarakhand', 'Goa', 'Jammu & Kashmir', 'Manipur', 'Meghalaya',
                'Tripura', 'Nagaland', 'Mizoram', 'Arunachal Pradesh', 'Sikkim',
              ]
              const [expanded, setExpanded] = React.useState(false)
              const visible = expanded ? ALL_HUBS : ALL_HUBS.slice(0, 6)
              const remaining = ALL_HUBS.length - 6
              return (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin size={14} style={{ color: '#5D4037' }} /> Delivery Hubs
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {visible.map(hub => (
                      <button key={hub}
                        onClick={() => navigate(`/buyer/browse?location=${encodeURIComponent(hub)}`)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors">
                        {hub}
                      </button>
                    ))}
                    {!expanded && (
                      <button onClick={() => setExpanded(true)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                        style={{ color: '#5D4037', background: '#FCE7D6' }}>
                        +{remaining} more
                      </button>
                    )}
                    {expanded && (
                      <button onClick={() => setExpanded(false)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                        style={{ color: '#5D4037', background: '#FCE7D6' }}>
                        Show less
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

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
      <AddCampaignModal
        open={showAddCampaign}
        onClose={() => setShowAddCampaign(false)}
        onSave={handleAddCampaign}
        manufacturerId={user?._id || 'local'}
        manufacturerName={user?.company || user?.name || 'Manufacturer'}
      />
    </div>
  )
}

