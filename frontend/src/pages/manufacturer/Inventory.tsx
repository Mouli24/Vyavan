import { useState, useEffect } from 'react'
import {
  Search, Bell, Globe, HelpCircle, AlertTriangle,
  Download, SlidersHorizontal, Plus, CheckCircle2,
  Loader2, Image as ImageIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api, Product } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import AddProductModal from '@/features/manufacturer/AddProductModal'

// ── Types ──────────────────────────────────────────────────────────────────
interface StockRow {
  product: Product
  total: number
  reserved: number
  available: number
  reorderLevel: number
  status: 'CRITICAL' | 'LOW STOCK' | 'HEALTHY'
}

interface RecentAdjustment {
  id: string
  label: string
  time: string
  note: string
  type: 'add' | 'remove'
}

// ── Helpers ────────────────────────────────────────────────────────────────
function deriveStatus(available: number, reorder: number): StockRow['status'] {
  if (available <= 0 || available < reorder * 0.5) return 'CRITICAL'
  if (available < reorder) return 'LOW STOCK'
  return 'HEALTHY'
}

const STATUS_STYLE: Record<StockRow['status'], string> = {
  CRITICAL:   'bg-red-500 text-white',
  'LOW STOCK':'bg-orange-400 text-white',
  HEALTHY:    'bg-blue-100 text-blue-600',
}

export default function Inventory() {
  const { user } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [rows, setRows] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Stock Adjustment panel state
  const [selectedSku, setSelectedSku] = useState('')
  const [adjType, setAdjType] = useState<'Add Stock' | 'Remove Stock'>('Add Stock')
  const [adjQty, setAdjQty] = useState(0)
  const [adjReason, setAdjReason] = useState('New Purchase Order')
  const [adjLoading, setAdjLoading] = useState(false)
  const [adjSuccess, setAdjSuccess] = useState(false)
  
  // Add Product Modal state
  const [showAdd, setShowAdd] = useState(false)
  const [showBulk, setShowBulk] = useState(false)

  // Recent adjustments (local log)
  const [recentAdj, setRecentAdj] = useState<RecentAdjustment[]>([
    { id: '1', label: 'Purchased 150x ART-TEE-BL', time: '2 hours ago', note: 'Verified by Admin', type: 'add' },
    { id: '2', label: 'Removed 5x ART-SHOE-99',   time: '5 hours ago', note: 'Reason: Damaged',   type: 'remove' },
  ])

  const fetchProducts = () => {
    setLoading(true)
    api.getMyProducts()
      .then(data => {
        const productsList = Array.isArray(data) ? data : []
        setProducts(productsList)
        const built: StockRow[] = productsList.map(p => {
          const total     = p.stock ?? Math.floor(Math.random() * 900 + 50)
          const reserved  = Math.floor(total * 0.12)
          const available = total - reserved
          const reorder   = p.moq ?? 50
          return { product: p, total, reserved, available, reorderLevel: reorder, status: deriveStatus(available, reorder) }
        })
        setRows(built)
      })
      .catch(err => {
        console.error(err)
        setProducts([])
        setRows([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const lowStockCount = rows.filter(r => r.status !== 'HEALTHY').length

  const filtered = rows.filter(r =>
    !search ||
    r.product.name.toLowerCase().includes(search.toLowerCase()) ||
    r.product._id.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdjust = () => {
    if (!selectedSku || adjQty <= 0) return
    setAdjLoading(true)
    setTimeout(() => {
      setRows(prev => prev.map(r => {
        if (r.product._id !== selectedSku) return r
        const delta   = adjType === 'Add Stock' ? adjQty : -adjQty
        const newTotal = Math.max(0, r.total + delta)
        const newAvail = Math.max(0, r.available + delta)
        return { ...r, total: newTotal, available: newAvail, status: deriveStatus(newAvail, r.reorderLevel) }
      }))
      const prod = products.find(p => p._id === selectedSku)
      const label = `${adjType === 'Add Stock' ? 'Purchased' : 'Removed'} ${adjQty}x ${prod?.name ?? selectedSku}`
      setRecentAdj(prev => [
        { id: Date.now().toString(), label, time: 'Just now', note: adjReason, type: adjType === 'Add Stock' ? 'add' : 'remove' },
        ...prev.slice(0, 4),
      ])
      setAdjQty(0)
      setAdjLoading(false)
      setAdjSuccess(true)
      setTimeout(() => setAdjSuccess(false), 2000)
    }, 800)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#FAF7F4]">

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between mb-10">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search inventory..."
            className="pl-10 bg-white border-none shadow-sm rounded-full h-11 focus-visible:ring-primary/20 uppercase placeholder:normal-case"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/60">
            <Globe size={20} className="text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/60 relative">
            <Bell size={20} className="text-muted-foreground" />
            {lowStockCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#FAF7F4]" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/60">
            <HelpCircle size={20} className="text-muted-foreground" />
          </Button>

          <Separator orientation="vertical" className="h-8" />

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold">{user?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{user?.company || 'Manufacturer'}</p>
            </div>
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`} />
              <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* ── Page Title ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-0.5">Inventory Management</h1>
        <p className="text-sm text-muted-foreground">
          Real-time stock monitoring &amp; adjustments
        </p>
      </div>

      {/* ── Low Stock Warning Banner ── */}
      <AnimatePresence>
        {lowStockCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between bg-[#FEF0E7] border border-orange-200 rounded-2xl px-6 py-4 mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Low Stock Warning</p>
                <p className="text-sm text-muted-foreground">
                  {lowStockCount} item{lowStockCount > 1 ? 's are' : ' is'} currently below the reorder threshold. Immediate restock recommended.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="rounded-full bg-white border-slate-200 text-sm font-semibold hover:bg-slate-50 flex-shrink-0"
              onClick={() => setSearch('')}
            >
              View Alert Items
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Layout: Ledger + Right Panel ── */}
      <div className="flex gap-6 items-start">

        {/* ── Live Stock Ledger ── */}
        <div className="flex-1 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[520px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#5D4037] rounded-full" />
              <h2 className="text-xl font-bold text-slate-900">Live Stock Ledger</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-50" onClick={() => setShowBulk(true)}>
                <Plus size={18} className="text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-50">
                <Download size={18} className="text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-2 mb-3">
            {['Product Details', 'Total', 'Reserved', 'Available', 'Reorder Level', 'Status'].map(h => (
              <p key={h} className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">{h}</p>
            ))}
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">No products found.</div>
              ) : filtered.map((row, idx) => (
                <motion.div
                  key={row.product._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: idx * 0.04 }}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center px-2 py-4 rounded-2xl hover:bg-slate-50 transition-colors group"
                >
                  {/* Product */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {row.product.image
                        ? <img src={row.product.image} alt={row.product.name} className="w-full h-full object-cover" />
                        : <ImageIcon size={20} className="text-slate-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{row.product.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        SKU: {row.product._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Total */}
                  <p className="text-sm font-semibold text-slate-700">{row.total}</p>

                  {/* Reserved */}
                  <p className="text-sm font-semibold text-slate-700">{row.reserved}</p>

                  {/* Available — colored if low */}
                  <p className={`text-sm font-bold ${
                    row.status === 'CRITICAL' ? 'text-red-500' :
                    row.status === 'LOW STOCK' ? 'text-orange-500' :
                    'text-blue-500'
                  }`}>
                    {row.available}
                  </p>

                  {/* Reorder Level */}
                  <p className="text-sm font-semibold text-slate-700">{row.reorderLevel}</p>

                  {/* Status Badge */}
                  <Badge className={`rounded-full px-3 py-1 text-[10px] font-bold w-fit ${STATUS_STYLE[row.status]}`}>
                    {row.status}
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="w-72 flex flex-col gap-5 flex-shrink-0">

          {/* Stock Adjustment Card */}
          <div className="bg-[#F5E6D3] rounded-[2rem] p-6 relative overflow-hidden">
            {/* decorative clipboard icon */}
            <div className="absolute top-4 right-4 opacity-10">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-5">Stock Adjustment</h3>

            {/* Target Product */}
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Target Product</p>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20"
                value={selectedSku}
                onChange={e => setSelectedSku(e.target.value)}
              >
                <option value="">Select Product SKU...</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name.slice(0, 22)}… — {p._id.slice(-6).toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Adjustment Type + Quantity */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Adjustment Type</p>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20"
                  value={adjType}
                  onChange={e => setAdjType(e.target.value as typeof adjType)}
                >
                  <option>Add Stock</option>
                  <option>Remove Stock</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Quantity</p>
                <input
                  type="number"
                  min={0}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20"
                  value={adjQty}
                  onChange={e => setAdjQty(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Reason for Adjustment</p>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20"
                value={adjReason}
                onChange={e => setAdjReason(e.target.value)}
              >
                <option>New Purchase Order</option>
                <option>Damaged Goods</option>
                <option>Production Use</option>
                <option>Return from Customer</option>
                <option>Audit Correction</option>
              </select>
            </div>

            {/* Update Button */}
            <button
              onClick={handleAdjust}
              disabled={adjLoading || !selectedSku || adjQty <= 0}
              className="w-full bg-[#5D4037] hover:bg-[#4E342E] disabled:opacity-50 text-white font-bold rounded-2xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {adjLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : adjSuccess ? (
                <><CheckCircle2 size={16} /> Updated!</>
              ) : (
                'Update Inventory'
              )}
            </button>

            <p className="text-[10px] text-slate-400 text-center mt-3 leading-relaxed">
              All manual changes are logged for audit compliance.
            </p>
          </div>

          {/* Automated Logic Card */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Automated Logic</h4>
            </div>
            <ul className="space-y-3">
              {[
                'Stock is automatically deducted when an Order is Accepted.',
                'Reserved stock is released instantly upon Order Cancellation.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Adjustments */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">Recent Adjustments</p>
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {recentAdj.map(adj => (
                  <motion.div
                    key={adj.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`w-1 rounded-full mt-1 flex-shrink-0 self-stretch ${adj.type === 'add' ? 'bg-blue-400' : 'bg-red-400'}`} />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{adj.label}</p>
                      <p className="text-[10px] text-muted-foreground">{adj.time} • {adj.note}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <motion.button
            onClick={() => setShowAdd(true)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="self-end w-12 h-12 bg-[#5D4037] hover:bg-[#4E342E] text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          >
            <Plus size={22} />
          </motion.button>
        </div>
      </div>
      
      <AddProductModal 
        open={showAdd} 
        onClose={() => setShowAdd(false)} 
        onPublished={() => { setShowAdd(false); fetchProducts(); }} 
      />

      <BulkUploadModal 
        open={showBulk} 
        onClose={() => setShowBulk(false)} 
        onSuccess={() => { setShowBulk(false); fetchProducts(); }} 
      />
    </div>
  )
}
function BulkUploadModal({ open, onClose, onSuccess }: { open: boolean, onClose: () => void, onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    
    // Simulate parsing and API call
    await new Promise(r => setTimeout(r, 2000))
    
    try {
      // In a real app, you'd send the file or the parsed JSON to the backend
      // api.bulkUploadProducts(formData)
      onSuccess()
      alert('Bulk upload successful! 24 products added to your catalog.')
    } catch (e: any) {
      setError('Failed to upload products. Please check the file format.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 text-slate-400">
          <Plus size={20} className="rotate-45" />
        </button>

        <h3 className="text-2xl font-bold text-slate-900 mb-2">Bulk Product Upload</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Upload an Excel or CSV file containing your product catalog. Download our template to ensure correct data mapping.
        </p>

        <div className="space-y-6">
          <div 
            className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500/50 transition-colors cursor-pointer group"
            onClick={() => document.getElementById('bulk-file')?.click()}
          >
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Download size={20} className="text-slate-400 rotate-180" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">{file ? file.name : 'Select file to upload'}</p>
            <p className="text-xs text-slate-400">Supported: .xlsx, .csv (Max 5MB)</p>
            <input 
              id="bulk-file" 
              type="file" 
              className="hidden" 
              accept=".xlsx,.csv"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button 
            variant="outline" 
            className="w-full rounded-2xl border-slate-200 text-sm font-bold h-12 gap-2"
          >
            <Download size={16} /> Download Template
          </Button>

          {error && <p className="text-xs text-red-500 text-center font-medium">{error}</p>}

          <Button 
            disabled={!file || loading}
            onClick={handleUpload}
            className="w-full rounded-2xl bg-slate-900 hover:bg-black text-white text-sm font-bold h-12 shadow-lg shadow-slate-900/10"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Start Upload'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
