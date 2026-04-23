import {
  Plus, Edit3, Star, Image as ImageIcon, Trash2,
  MessageSquare, Zap, Store, Package, Truck,
  ArrowRight, Loader2, Sparkles, TrendingUp, MapPin,
  Bell, X, Calendar, Tag, Percent, Clock,
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
};

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
    setLoadingProducts(true);
    api.getMyProducts()
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  };

  useEffect(() => {
    fetchProducts();
    api.getOnboardingAdvice()
      .then(plan => setOnboardingPlan(plan))
      .catch(() => {})
      .finally(() => setLoadingOnboarding(false));
      
    const all = loadCampaigns()
    const mine = all.filter(c => c.manufacturerId === (user?._id || 'local'))
      .map(c => ({ ...c, status: computeStatus(c) }))
    setCampaigns(mine)
  }, [user?._id])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setShowAddProduct(false);
    setEditProduct(null);
  };

  const handlePublished = () => {
    handleModalClose();
    fetchProducts();
  };

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

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowAddProduct(true);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 overflow-y-auto bg-[#FAF7F4]"
    >
      <div className="p-6 lg:p-10 space-y-8">

        {/* ── Page Header ── */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight leading-tight">
              My Store
            </h1>
            <p className="text-[#A89F91] mt-1 text-sm">
              Your store's performance overview and operational control center.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E5E1DA] bg-white text-[#6B4E3D] text-sm font-semibold hover:bg-[#F5E6D3] transition-all shadow-sm"
            >
              <Edit3 size={15} /> Customize Storefront
            </button>
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold rounded-full text-sm transition-all shadow-sm"
            >
              <Plus size={15} /> New Product
            </button>
          </div>
        </motion.div>

        <AddProductModal
          open={showAddProduct}
          onClose={handleModalClose}
          onPublished={handlePublished}
          editProduct={editProduct}
        />

        {/* ── Top Grid: Onboarding + Stat Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Onboarding / AI Guidance Card */}
          <motion.div variants={itemVariants} className="lg:col-span-12 xl:col-span-5 bg-gradient-to-br from-[#F5E6D3] to-[#F9EFE4] rounded-[2rem] border border-[#E5D5C0] p-7 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            {loadingOnboarding ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 relative z-10">
                <Loader2 className="w-7 h-7 text-[#5D4037] animate-spin mb-3" />
                <p className="text-sm font-bold text-[#5D4037] text-center">AI Agent calculating<br/>optimal next steps...</p>
              </div>
            ) : onboardingPlan ? (
              <div className="relative z-10 flex flex-col h-full gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-[#5D4037]/10 text-[#5D4037] text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={10} /> Agent Guidance
                    </span>
                    <span className="text-sm font-bold text-[#5D4037]">{onboardingPlan.completion_percentage}% Complete</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-2 leading-tight">
                    {onboardingPlan.next_action?.title || onboardingPlan.headline_message}
                  </h3>
                  <p className="text-xs text-[#6B4E3D] mb-4 leading-relaxed">
                    {onboardingPlan.next_action?.description || onboardingPlan.agent_advice}
                  </p>
                  {onboardingPlan.missing_fields?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {onboardingPlan.missing_fields.slice(0, 3).map((field: string) => (
                        <span key={field} className="text-[9px] bg-white/50 text-[#5D4037] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-[#E5D5C0]">
                          Missing: {field}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => navigate(onboardingPlan.next_action?.redirect_url || '/manufacturer/settings')}
                    className="w-full bg-[#5D4037] hover:bg-[#4E342E] text-white text-xs font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    {onboardingPlan.next_action?.action_button || 'Continue Setup'} <ArrowRight size={13} />
                  </button>
                  <div className="w-full h-1.5 bg-[#5D4037]/10 rounded-full overflow-hidden mt-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${onboardingPlan.completion_percentage}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-[#5D4037] rounded-full"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col h-full gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-[#5D4037]/10 text-[#5D4037] text-[10px] font-bold rounded-full uppercase tracking-wider">Active Store</span>
                    <span className="text-sm font-bold text-[#5D4037]">100% Complete</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2 leading-tight">Profile Built!</h3>
                  <p className="text-sm text-[#6B4E3D] max-w-[200px] leading-relaxed">
                    Your profile is completely set up. You are ready to receive orders!
                  </p>
                </div>
                <div className="mt-auto w-full h-1.5 bg-[#5D4037]/10 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#5D4037] rounded-full" />
                </div>
              </div>
            )}
          </motion.div>

          {/* Stat Cards */}
          <div className="lg:col-span-12 xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-7">
              <p className="text-[10px] uppercase font-bold text-[#A89F91] tracking-widest mb-4">Store Rating</p>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-bold text-[#1A1A1A] tracking-tight">4.8</span>
                <div className="flex text-[#C47A2B]">
                  {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
                </div>
              </div>
              <p className="text-sm text-[#A89F91]">
                <span className="text-green-600 font-bold">+12%</span> from last month's reviews
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-7">
              <p className="text-[10px] uppercase font-bold text-[#A89F91] tracking-widest mb-4">Catalog Size</p>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-bold text-[#1A1A1A] tracking-tight">{products.length}</span>
                <span className="text-lg text-[#A89F91] font-medium">SKUs</span>
              </div>
              <p className="text-sm text-[#A89F91]">Active products listed</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-7">
              <div className="w-9 h-9 bg-[#FCE7D6] rounded-xl flex items-center justify-center mb-4">
                <TrendingUp size={16} className="text-[#6B4E3D]" />
              </div>
              <p className="text-[10px] uppercase font-bold text-[#A89F91] tracking-widest mb-1">Monthly Revenue</p>
              <p className="text-2xl font-bold text-[#1A1A1A] tracking-tight">₹2.4L</p>
              <p className="text-xs text-green-600 font-medium mt-1">+8% this month</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-7">
              <div className="w-9 h-9 bg-[#F5E6D3] rounded-xl flex items-center justify-center mb-4">
                <MapPin size={16} className="text-[#6B4E3D]" />
              </div>
              <p className="text-[10px] uppercase font-bold text-[#A89F91] tracking-widest mb-1">Delivery Reach</p>
              <p className="text-2xl font-bold text-[#1A1A1A] tracking-tight">12</p>
              <p className="text-xs text-[#A89F91] font-medium mt-1">States covered</p>
            </motion.div>
          </div>
        </div>

        {/* ── AI Image Studio Banner ── */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-8 flex flex-col sm:flex-row items-center gap-8">
          <div className="relative w-full sm:w-64 h-40 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
            <img
              src="https://picsum.photos/seed/industrial/600/400"
              alt="AI Enhanced"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <Zap size={11} className="text-white fill-white" />
              <span className="text-[10px] text-white font-bold uppercase tracking-wider">AI Studio Enabled</span>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
              <div className="w-1 h-5 bg-[#5D4037] rounded-full" />
              <h2 className="text-xl font-bold text-[#1A1A1A]">AI Image Studio</h2>
            </div>
            <p className="text-[#A89F91] text-sm mb-6 leading-relaxed max-w-lg">
              Instantly enhance your product catalog photos. Adjust lighting, remove backgrounds, and sharpen textures automatically.
            </p>
            <div className="flex gap-3 flex-wrap justify-center sm:justify-start">
              <button className="px-6 py-2.5 bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold rounded-full text-sm transition-all shadow-sm">
                Open Studio
              </button>
              <button className="px-6 py-2.5 bg-white border border-[#E5E1DA] text-[#6B4E3D] font-semibold rounded-full text-sm hover:bg-[#F5E6D3] transition-all">
                Learn More
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Bottom Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Product Management */}
          <motion.div variants={itemVariants} className="lg:col-span-8 bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm overflow-hidden">
            <div className="px-8 pt-8 pb-5 flex items-center justify-between border-b border-[#F5F2ED]">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-[#5D4037] rounded-full" />
                <h2 className="text-xl font-bold text-[#1A1A1A]">Product Management</h2>
              </div>
              <button className="flex items-center gap-1.5 text-sm font-bold text-[#5D4037] hover:gap-3 transition-all">
                View All <ArrowRight size={14} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-3">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-[#5D4037]" />
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#A89F91]">
                  <ImageIcon size={32} />
                  <p className="text-sm font-medium">No products listed</p>
                </div>
              ) : products.map((product) => (
                <div key={product._id} className="bg-[#FAF7F4] rounded-2xl p-4 flex items-center gap-4 hover:bg-[#F5EDE4] transition-colors group">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-[#E5E1DA] overflow-hidden flex-shrink-0">
                    {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#1A1A1A] truncate">{product.name}</h4>
                    <p className="text-xs text-[#A89F91]">Qty: {product.stock || 0} · Price: ₹{product.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(product)} className="p-2 text-[#A89F91] hover:text-[#5D4037] rounded-lg transition-all"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(product._id)} className="p-2 text-[#A89F91] hover:text-red-500 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Side Widgets */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Active Campaigns */}
            <div className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#1A1A1A]">Active Campaigns</h3>
                <button onClick={() => setShowAddCampaign(true)} className="w-8 h-8 rounded-full bg-[#5D4037] text-white flex items-center justify-center hover:bg-[#4E342E] transition-all">
                   <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {campaigns.length === 0 ? (
                  <div className="text-center py-6">
                    <Tag size={24} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs text-slate-400">No active campaigns</p>
                  </div>
                ) : campaigns.map(c => (
                  <div key={c.id} className="bg-[#FAF7F4] p-4 rounded-2xl flex items-center gap-3 relative border border-[#F5F2ED] group">
                    <div className="w-9 h-9 bg-[#FCE7D6] text-[#5D4037] rounded-xl flex items-center justify-center flex-shrink-0">
                      {c.discountType === 'percent' ? <Percent size={15} /> : <Tag size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#1A1A1A] truncate">{c.name}</h4>
                      <p className="text-[10px] text-[#A89F91]">{c.status} · Ends {new Date(c.endDate).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDeleteCampaign(c.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Hubs */}
            <div className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-7">
               <h3 className="text-base font-bold text-[#1A1A1A] mb-5 flex items-center gap-2">
                 <MapPin size={16} className="text-[#5D4037]" /> Delivery Hubs
               </h3>
               <div className="flex flex-wrap gap-2">
                {['Maharashtra', 'Gujarat', 'Tamil Nadu', 'Karnataka', 'Delhi', 'Rajasthan'].map(hub => (
                  <span key={hub} className="px-3 py-1.5 bg-[#FAF7F4] text-[#6B4E3D] text-[10px] font-bold rounded-full border border-[#F5F2ED]">
                    {hub}
                  </span>
                ))}
                <span className="px-3 py-1.5 bg-[#FCE7D6] text-[#5D4037] text-[10px] font-bold rounded-full">+24 more</span>
               </div>
            </div>
          </div>
        </div>

        {/* ── Logistics Section ── */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-8 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">Omni-Channel Logistics</h2>
            <p className="text-[#A89F91] text-sm mb-6 leading-relaxed">
              Optimized fulfillment pathways across rail, road, and air. Direct factory pickup enabled for verified enterprise buyers.
            </p>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Truck,   label: 'Road' },
                { icon: Package, label: 'Rail' },
                { icon: Zap,     label: 'Air' },
                { icon: Store,   label: 'Pickup' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-[#F5E6D3] text-[#5D4037] rounded-xl flex items-center justify-center">
                    <item.icon size={18} />
                  </div>
                  <span className="text-[9px] font-bold text-[#A89F91] uppercase">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-1/3 aspect-video bg-[#FAF7F4] rounded-2xl overflow-hidden relative border border-[#F5F2ED] flex-shrink-0">
             <img src="https://picsum.photos/seed/map/800/600" className="w-full h-full object-cover opacity-60 grayscale" alt="Map" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#5D4037] rounded-full animate-pulse" />
          </div>
        </motion.div>
      </div>

      <AddCampaignModal
        open={showAddCampaign}
        onClose={() => setShowAddCampaign(false)}
        onSave={handleAddCampaign}
        manufacturerId={user?._id || 'local'}
        manufacturerName={user?.company || user?.name || 'Manufacturer'}
      />
    </motion.div>
  )
}
