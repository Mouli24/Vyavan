import {
  HelpCircle,
  Search,
  Globe,
  Bell,
  Plus,
  Edit3,
  Star,
  Image as ImageIcon,
  Trash2,
  MessageSquare,
  Zap,
  Store,
  Package,
  Truck,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import AddProductModal from '@/features/manufacturer/AddProductModal';
import { api, Product } from '@/lib/api';

export default function MyStore() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = () => {
    setLoadingProducts(true);
    api.getMyProducts()
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error(err);
        setProducts([]);
      })
      .finally(() => setLoadingProducts(false));
  };

  useEffect(() => { fetchProducts(); }, []);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 p-8 overflow-y-auto bg-brand-warm"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-8">
          <h2 className="text-xl font-serif font-medium text-brand-bronze">Manufacturer Hub</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search orders, stock or shipments..."
              className="pl-10 pr-4 py-2 bg-slate-100/50 border border-slate-200 rounded-full w-80 text-sm focus:outline-none focus:ring-2 focus:ring-brand-peach/50 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-slate-500">
            <Globe size={20} className="cursor-pointer hover:text-slate-800" />
            <HelpCircle size={20} className="cursor-pointer hover:text-slate-800" />
            <div className="relative">
              <Bell size={20} className="cursor-pointer hover:text-slate-800" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-brand-warm"></span>
            </div>
          </div>
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">Rajesh Kumar</p>
              <p className="text-[10px] text-slate-400 font-medium">Store Admin</p>
            </div>
            <img
              src="https://picsum.photos/seed/rajesh/100/100"
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.div variants={itemVariants} className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            My Store <span className="font-normal text-brand-accent">Management</span>
          </h1>
          <p className="text-slate-500 max-w-md text-sm">
            Your industrial atelier's performance overview and operational control center.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-xl text-sm hover:bg-blue-100 transition-colors">
            <Edit3 size={16} />
            Customize Storefront
          </button>
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-bronze text-white font-semibold rounded-xl text-sm hover:bg-brand-bronze/90 transition-colors"
          >
            <Plus size={16} />
            New Product
          </button>
        </div>
      </motion.div>

      <AddProductModal
        open={showAddProduct}
        onClose={handleModalClose}
        onPublished={handlePublished}
        editProduct={editProduct}
      />

      {/* Top Grid */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <motion.div variants={itemVariants} className="col-span-4 bg-brand-peach/20 p-8 rounded-[32px] relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 bg-brand-peach text-brand-bronze text-[10px] font-bold rounded-full uppercase tracking-wider">Active Store</span>
            <span className="text-sm font-bold text-brand-bronze">85% Complete</span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-brand-bronze mb-3 leading-tight">
            Finish Your Store<br />Identity Setup
          </h3>
          <p className="text-sm text-brand-bronze/70 mb-8 max-w-[200px]">
            Add tax details and warehouse locations to unlock global shipments.
          </p>
          <div className="w-full h-2 bg-brand-bronze/10 rounded-full overflow-hidden">
            <div className="w-[85%] h-full bg-brand-bronze"></div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-4 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4">Store Rating</p>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-6xl font-serif font-bold text-slate-900">4.8</span>
            <div className="flex text-brand-bronze">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
          </div>
          <p className="text-sm text-slate-400">
            <span className="text-green-600 font-bold">+12%</span> from last month's buyer reviews
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-4 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4">Inventory Depth</p>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-6xl font-serif font-bold text-slate-900">124</span>
            <span className="text-xl font-serif text-slate-400">SKUs</span>
          </div>
          <p className="text-sm text-slate-400">Active products across 5 categories</p>
        </motion.div>
      </div>

      {/* AI Banner */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-brand-peach/10 to-purple-50 p-10 rounded-[40px] mb-8 flex items-center gap-12 border border-white/50">
        <div className="relative w-72 h-44 rounded-3xl overflow-hidden shadow-2xl group">
          <img
            src="https://picsum.photos/seed/industrial/600/400"
            alt="AI Enhanced"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
            <Zap size={12} className="text-white fill-white" />
            <span className="text-[10px] text-white font-bold uppercase tracking-wider">AI Enhanced Original</span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">AI Image Studio</h2>
          <p className="text-slate-500 max-w-xl mb-8 leading-relaxed">
            Instantly enhance your product catalog photos. Our AI adjusts lighting, removes backgrounds, and sharpens textures to industrial-grade standards.
          </p>
          <div className="flex gap-4">
            <button className="px-8 py-3 bg-slate-900 text-white font-bold rounded-full text-sm hover:bg-slate-800 transition-colors">
              Launch Studio
            </button>
            <button className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-full text-sm hover:bg-slate-50 transition-colors">
              Bulk Auto-Enhance
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Product Management */}
        <motion.div variants={itemVariants} className="col-span-8 bg-brand-peach/10 p-10 rounded-[40px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif font-bold text-slate-900">Product Management</h2>
            <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
              View Full Catalog <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-brand-bronze" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                <ImageIcon size={36} />
                <p className="text-sm font-medium">No products yet. Add your first product!</p>
              </div>
            ) : products.map((product) => (
              <div key={product._id} className="bg-white p-6 rounded-[32px] flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-peach/20 transition-colors overflow-hidden flex-shrink-0">
                  {product.image
                    ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    : <ImageIcon size={24} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 mb-1 truncate">{product.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">
                    {product.category ?? '—'} • MOQ: {product.moq} {product.unit}
                  </p>
                </div>
                <div className="text-right px-6 flex-shrink-0">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Base Price</p>
                  <p className="text-lg font-serif font-bold text-slate-800">₹{product.price?.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-3 text-slate-400 hover:text-brand-bronze hover:bg-brand-peach/20 rounded-xl transition-all"
                    title="Edit product"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    disabled={deletingId === product._id}
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                    title="Delete product"
                  >
                    {deletingId === product._id
                      ? <Loader2 size={18} className="animate-spin" />
                      : <Trash2 size={18} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Side Widgets */}
        <div className="col-span-4 flex flex-col gap-8">
          <motion.div variants={itemVariants} className="bg-purple-50/50 p-8 rounded-[40px] border border-purple-100">
            <h3 className="text-lg font-serif font-bold text-slate-900 mb-6">Active Campaigns</h3>
            <div className="flex flex-col gap-4">
              <div className="bg-white p-5 rounded-3xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Monsoon Bulk Sale</h4>
                  <p className="text-[10px] text-slate-400">Ends in 4 days</p>
                </div>
                <div className="ml-auto">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-bold rounded-md uppercase">Live</span>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-12 h-12 bg-brand-bronze rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg"
                >
                  <MessageSquare size={18} className="-translate-x-2" />
                </motion.div>
              </div>
              <div className="bg-white/60 p-5 rounded-3xl flex items-center gap-4 border border-slate-100">
                <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400">Early Bird 2025</h4>
                  <p className="text-[10px] text-slate-300">Starts next month</p>
                </div>
                <div className="ml-auto">
                  <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[9px] font-bold rounded-md uppercase">Scheduled</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/50">
            <h3 className="text-lg font-serif font-bold text-slate-900 mb-6">Delivery Hubs</h3>
            <div className="flex flex-wrap gap-2">
              {['Maharashtra', 'Gujarat', 'Tamil Nadu', 'Karnataka', '+8 more'].map((hub, idx) => (
                <motion.span
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    hub.startsWith('+') ? 'text-slate-400 hover:text-slate-600' : 'bg-white text-slate-600 hover:bg-brand-peach/20'
                  }`}
                >
                  {hub}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Logistics Section */}
      <motion.div variants={itemVariants} className="mt-12 mb-8 bg-white p-12 rounded-[48px] shadow-sm border border-slate-100 flex items-center gap-16">
        <div className="flex-1">
          <h2 className="text-4xl font-serif font-bold text-slate-900 mb-6">Omni-Channel Logistics</h2>
          <p className="text-slate-500 mb-10 leading-relaxed">
            Optimized fulfillment pathways across rail, road, and air. Direct factory pickup enabled for verified enterprise buyers.
          </p>
          <div className="grid grid-cols-4 gap-6">
            {[
              { icon: Truck, label: 'Road Freight' },
              { icon: Package, label: 'Rail Network' },
              { icon: Zap, label: 'Air Cargo' },
              { icon: Store, label: 'Self Pickup' }
            ].map((item, idx) => (
              <motion.div key={idx} whileHover={{ y: -5 }} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-brand-peach/20 text-brand-bronze rounded-2xl flex items-center justify-center hover:bg-brand-peach/40 transition-colors cursor-pointer">
                  <item.icon size={24} />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="w-[45%] aspect-video bg-slate-100 rounded-[32px] overflow-hidden relative border-4 border-white shadow-xl">
          <img
            src="https://picsum.photos/seed/map/800/600"
            alt="Logistics Map"
            className="w-full h-full object-cover opacity-60 grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-peach/20 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute -inset-4 bg-brand-bronze/20 rounded-full animate-ping"></div>
              <div className="relative w-4 h-4 bg-brand-bronze rounded-full border-2 border-white shadow-lg"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
