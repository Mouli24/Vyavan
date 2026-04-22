import {
  Plus, Edit3, Star, Image as ImageIcon, Trash2,
  MessageSquare, Zap, Store, Package, Truck,
  ArrowRight, Loader2, Sparkles, TrendingUp, MapPin,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import AddProductModal from '@/features/manufacturer/AddProductModal';
import { api, Product } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

export default function MyStore() {
  const navigate = useNavigate();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [onboardingPlan, setOnboardingPlan] = useState<any>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);

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
  }, []);

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowAddProduct(true);
  };

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
          <motion.div variants={itemVariants} className="lg:col-span-5 bg-gradient-to-br from-[#F5E6D3] to-[#F9EFE4] rounded-[2rem] border border-[#E5D5C0] p-7 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
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
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-7">
              <p className="text-[10px] uppercase font-bold text-[#A89F91] tracking-widest mb-4">Store Rating</p>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-bold text-[#1A1A1A] tracking-tight">4.8</span>
                <div className="flex text-[#C47A2B]">
                  {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
                </div>
              </div>
              <p className="text-sm text-[#A89F91]">
                <span className="text-green-600 font-bold">+12%</span> from last month's buyer reviews
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-7">
              <p className="text-[10px] uppercase font-bold text-[#A89F91] tracking-widest mb-4">Inventory Depth</p>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-bold text-[#1A1A1A] tracking-tight">{products.length}</span>
                <span className="text-lg text-[#A89F91] font-medium">SKUs</span>
              </div>
              <p className="text-sm text-[#A89F91]">Active products across 5 categories</p>
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
              <p className="text-[10px] uppercase font-bold text-[#A89F91] tracking-widest mb-1">Delivery Zones</p>
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
              <span className="text-[10px] text-white font-bold uppercase tracking-wider">AI Enhanced</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-[#5D4037] rounded-full" />
              <h2 className="text-xl font-bold text-[#1A1A1A]">AI Image Studio</h2>
            </div>
            <p className="text-[#A89F91] text-sm mb-6 leading-relaxed max-w-lg">
              Instantly enhance your product catalog photos. Our AI adjusts lighting, removes backgrounds, and sharpens textures to industrial-grade standards.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button className="px-6 py-2.5 bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold rounded-full text-sm transition-all shadow-sm">
                Launch Studio
              </button>
              <button className="px-6 py-2.5 bg-white border border-[#E5E1DA] text-[#6B4E3D] font-semibold rounded-full text-sm hover:bg-[#F5E6D3] transition-all">
                Bulk Auto-Enhance
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
                View Full Catalog <ArrowRight size={14} />
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
                  <p className="text-sm font-medium">No products yet. Add your first product!</p>
                </div>
              ) : products.map((product) => (
                <div key={product._id} className="bg-[#FAF7F4] rounded-2xl p-5 flex items-center gap-5 hover:bg-[#F5EDE4] transition-colors group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#A89F91] border border-[#E5E1DA] overflow-hidden flex-shrink-0">
                    {product.image
                      ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      : <ImageIcon size={20} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#1A1A1A] mb-0.5 truncate">{product.name}</h4>
                    <p className="text-xs text-[#A89F91] font-medium">
                      {product.category ?? '—'} · MOQ: {product.moq} {product.unit}
                    </p>
                  </div>
                  <div className="text-right px-4 flex-shrink-0">
                    <p className="text-[10px] uppercase font-bold text-[#A89F91] tracking-widest mb-0.5">Base Price</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">₹{product.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2.5 text-[#A89F91] hover:text-[#5D4037] hover:bg-[#FCE7D6] rounded-xl transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      disabled={deletingId === product._id}
                      className="p-2.5 text-[#A89F91] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                    >
                      {deletingId === product._id
                        ? <Loader2 size={16} className="animate-spin" />
                        : <Trash2 size={16} />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Side Widgets */}
          <div className="lg:col-span-4 flex flex-col gap-5">

            {/* Active Campaigns */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-7">
              <h3 className="text-base font-bold text-[#1A1A1A] mb-5">Active Campaigns</h3>
              <div className="flex flex-col gap-3">
                <div className="bg-[#FAF7F4] p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden">
                  <div className="w-9 h-9 bg-[#FCE7D6] text-[#6B4E3D] rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#1A1A1A]">Monsoon Bulk Sale</h4>
                    <p className="text-[10px] text-[#A89F91]">Ends in 4 days</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-bold rounded-full uppercase flex-shrink-0">Live</span>
                </div>
                <div className="bg-[#FAF7F4] p-4 rounded-2xl flex items-center gap-3 opacity-60">
                  <div className="w-9 h-9 bg-stone-100 text-stone-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#A89F91]">Early Bird 2025</h4>
                    <p className="text-[10px] text-[#A89F91]">Starts next month</p>
                  </div>
                  <span className="px-2 py-1 bg-stone-100 text-stone-400 text-[9px] font-bold rounded-full uppercase flex-shrink-0">Scheduled</span>
                </div>
              </div>
            </motion.div>

            {/* Delivery Hubs */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-7">
              <h3 className="text-base font-bold text-[#1A1A1A] mb-5">Delivery Hubs</h3>
              <div className="flex flex-wrap gap-2">
                {['Maharashtra', 'Gujarat', 'Tamil Nadu', 'Karnataka', '+8 more'].map((hub, idx) => (
                  <motion.span
                    key={idx}
                    whileHover={{ scale: 1.04 }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      hub.startsWith('+')
                        ? 'text-[#A89F91] hover:text-[#5D4037]'
                        : 'bg-[#F5E6D3] text-[#5D4037] hover:bg-[#FCE7D6]'
                    }`}
                  >
                    {hub}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Logistics Section ── */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm p-8 flex flex-col lg:flex-row items-center gap-10 pb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 bg-[#5D4037] rounded-full" />
              <h2 className="text-xl font-bold text-[#1A1A1A]">Omni-Channel Logistics</h2>
            </div>
            <p className="text-[#A89F91] text-sm mb-7 leading-relaxed max-w-md">
              Optimized fulfillment pathways across rail, road, and air. Direct factory pickup enabled for verified enterprise buyers.
            </p>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Truck,   label: 'Road Freight' },
                { icon: Package, label: 'Rail Network' },
                { icon: Zap,     label: 'Air Cargo' },
                { icon: Store,   label: 'Self Pickup' },
              ].map((item, idx) => (
                <motion.div key={idx} whileHover={{ y: -4 }} className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-12 h-12 bg-[#F5E6D3] text-[#5D4037] rounded-2xl flex items-center justify-center hover:bg-[#FCE7D6] transition-colors">
                    <item.icon size={20} />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#A89F91] tracking-widest text-center">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-[42%] aspect-video bg-[#F5F2ED] rounded-2xl overflow-hidden relative border border-[#E5E1DA] flex-shrink-0">
            <img
              src="https://picsum.photos/seed/map/800/600"
              alt="Logistics Map"
              className="w-full h-full object-cover opacity-50 grayscale"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#F5E6D3]/30 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#5D4037]/20 rounded-full animate-ping" />
                <div className="relative w-4 h-4 bg-[#5D4037] rounded-full border-2 border-white shadow-lg" />
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
