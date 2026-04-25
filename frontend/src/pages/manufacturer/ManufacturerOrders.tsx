import { useState, useEffect } from 'react'
import {
  TrendingUp, Package, Loader2, FileText, Upload, Calendar,
  Search, MoreHorizontal, ChevronLeft, ChevronRight,
  ArrowRight, Download, ShoppingBag, Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Input } from '@/components/ui/input'
import { api, Order } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

const STATUS_COLORS: Record<string, string> = {
  'In Production': 'bg-amber-100 text-amber-700',
  'Pending Payment': 'bg-[#F5E6D3] text-[#6B4E3D]',
  'Shipped':   'bg-green-100 text-green-700',
  'Delivered': 'bg-emerald-100 text-emerald-700',
  'Cancelled': 'bg-red-100 text-red-600',
  'New':       'bg-[#FCE7D6] text-[#5D4037]',
  'Confirmed': 'bg-[#F5E6D3] text-[#6B4E3D]',
  'Packed':    'bg-stone-100 text-stone-600',
}

const DOT_COLORS: Record<string, string> = {
  'In Production': 'bg-amber-500',
  'Pending Payment': 'bg-[#C47A2B]',
  'Shipped':   'bg-green-500',
  'Delivered': 'bg-emerald-500',
  'Cancelled': 'bg-red-500',
  'New':       'bg-[#5D4037]',
  'Confirmed': 'bg-[#6B4E3D]',
  'Packed':    'bg-stone-500',
}

const PAGE_SIZE = 5

export default function ManufacturerOrders() {
  const navigate = useNavigate()

  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showModModal, setShowModModal] = useState(false)
  const [showDispatchModal, setShowDispatchModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    Promise.all([
      api.getOrders().catch(() => []),
      api.getManufacturerStats().catch(() => null)
    ])
      .then(([ordersData, statsData]) => {
        setOrders(Array.isArray(ordersData) ? ordersData : [])
        setStats(statsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (orderId: string, status: string, extra: any = {}) => {
    setProcessingId(orderId)
    try {
      if (status === 'Confirmed') {
        await api.confirmOrder(orderId)
      } else if (status === 'Rejected') {
        const reason = extra.reason || prompt('Please provide a rejection reason:')
        if (!reason) return
        await api.rejectOrder(orderId, reason)
      } else if (status === 'Packed') {
        await api.packOrder(orderId)
      } else if (status === 'Shipped') {
        await api.dispatchOrder(orderId, {
          carrier: extra.carrier,
          trackingNumber: extra.tracking,
          invoiceUrl: extra.invoiceUrl,
          lorryReceiptUrl: extra.lrUrl
        })
      } else if (status === 'Modification Suggested') {
        // Mock API call
        await new Promise(r => setTimeout(r, 1000))
        alert('Modification request sent to buyer!')
      } else {
        await api.updateOrderStatus(orderId, status)
      }
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: status as Order['status'] } : o))
      setShowModModal(false)
      setShowDispatchModal(false)
    } catch (e: any) {
      alert(e.message || 'Failed to update status')
    } finally {
      setProcessingId(null)
    }
  }

  // Filter
  const filtered = orders.filter(o => {
    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'production' && o.status === 'In Production') ||
      (activeTab === 'shipped' && o.status === 'Shipped') ||
      (activeTab === 'pending' && o.status === 'Pending Payment')
    const matchSearch =
      !search ||
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.items?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  const newOrderCount = stats?.todayOrderCount ?? 0
  const pendingShipments = stats?.pendingShipments ?? 0
  const todayRevenue = stats?.todayRevenue ?? 0

  const handleExport = () => {
    if (filtered.length === 0) {
      alert('No orders match the current filter.')
      return
    }
    
    // Create CSV content
    const headers = ['Order ID', 'Customer Name', 'Location', 'Items', 'Status', 'Due Date', 'Value']
    const rows = filtered.map(o => {
      const customer = o.deliveryAddress?.companyName || o.buyer?.name || 'Unknown'
      const loc = o.deliveryAddress ? `${o.deliveryAddress.city}, ${o.deliveryAddress.state}` : (o.buyer?.location || 'Unknown')
      
      // Escape commas and quotes for CSV
      const escape = (str: string) => `"${String(str).replace(/"/g, '""')}"`
      
      return [
        escape(o.orderId),
        escape(customer),
        escape(loc),
        escape(o.items || ''),
        escape(o.status),
        escape(o.expectedDate || ''),
        escape(o.value || '')
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Orders_Report_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF7F4]">
      <div className="p-6 lg:p-10 space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight leading-tight">
              Orders
            </h1>
            <p className="text-[#A89F91] mt-1 text-sm">
              Manage and track your manufacturing orders in real-time.
            </p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E5E1DA] bg-white text-[#6B4E3D] text-sm font-semibold hover:bg-[#F5E6D3] transition-all shadow-sm flex-shrink-0"
          >
            <Download size={15} /> Export Report
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: ShoppingBag, label: 'New Orders',        value: newOrderCount,      bg: 'bg-[#FCE7D6]', iconColor: 'text-[#6B4E3D]' },
            { icon: TrendingUp,  label: 'Revenue Today',     value: `₹${todayRevenue.toLocaleString()}`, bg: 'bg-[#F5E6D3]', iconColor: 'text-[#5D4037]' },
            { icon: Package,     label: 'Pending Shipment',  value: pendingShipments,   bg: 'bg-stone-100',  iconColor: 'text-stone-600' },
            { icon: Clock,       label: 'Total Orders',      value: orders.length,      bg: 'bg-amber-50',   iconColor: 'text-amber-700' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-[1.5rem] border border-[#E5E1DA] shadow-sm p-5"
            >
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-4`}>
                <s.icon size={17} className={s.iconColor} />
              </div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#A89F91] mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Hero Banner ── */}
        <div className="bg-gradient-to-br from-[#F5E6D3] to-[#F9EFE4] rounded-[2rem] border border-[#E5D5C0] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#A89F91] mb-2">Action Required</p>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2 tracking-tight leading-snug">
              You have {newOrderCount} new orders to process.
            </h2>
            <p className="text-[#A89F91] text-sm mb-6 max-w-md leading-relaxed">
              Most orders require shipment verification within the next 24 hours.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button className="bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold rounded-full px-6 py-2.5 text-sm transition-all shadow-sm">
                Review All Orders
              </button>
              <button 
                onClick={handleExport}
                className="bg-white/70 hover:bg-white border border-[#E5D5C0] text-[#5D4037] font-semibold rounded-full px-6 py-2.5 text-sm transition-all"
              >
                Download Reports
              </button>
            </div>
          </div>
        </div>

        {/* ── Orders Table ── */}
        <div className="bg-white rounded-[2rem] border border-[#E5E1DA] shadow-sm overflow-hidden">

          {/* Table Header */}
          <div className="px-8 pt-8 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0EBE4]">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-5 bg-[#5D4037] rounded-full" />
                <h2 className="text-xl font-bold text-[#1A1A1A]">Active Orders</h2>
              </div>
              <p className="text-sm text-[#A89F91] ml-4">Real-time management of your manufacturing pipeline.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A89F91]" size={16} />
                <Input
                  placeholder="Search orders..."
                  className="pl-11 bg-[#F5F2ED] border-none rounded-full h-10 text-sm placeholder:text-[#A89F91] focus-visible:ring-0"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              <div className="flex items-center gap-1 bg-[#F5F2ED] rounded-full p-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'production', label: 'In Production' },
                  { key: 'shipped', label: 'Shipped' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setPage(1) }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activeTab === tab.key
                        ? 'bg-[#5D4037] text-white shadow-sm'
                        : 'text-[#A89F91] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-[1fr_2fr_1.5fr_1.2fr_1fr_1.5fr] gap-4 px-8 py-3 bg-[#FAF7F4]">
            {['Order ID', 'Customer', 'Items & Value', 'Status', 'Due Date', 'Actions'].map(h => (
              <p key={h} className={`text-[10px] uppercase tracking-widest font-bold text-[#A89F91] ${h === 'Actions' ? 'text-right' : ''}`}>{h}</p>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#F5F2ED]">
            <AnimatePresence mode="popLayout">
              {paginated.length === 0 ? (
                <div className="text-center py-16 text-[#A89F91] text-sm font-medium">No orders found.</div>
              ) : paginated.map((order, idx) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: idx * 0.04 }}
                  className="grid grid-cols-[1fr_2fr_1.5fr_1.2fr_1fr_1.5fr] gap-4 items-center px-8 py-5 hover:bg-[#FAF7F4] transition-colors group"
                >
                  {/* Order ID */}
                  <p className="font-mono text-xs font-bold text-[#5D4037]">{order.orderId}</p>

                  {/* Customer */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      idx % 3 === 0 ? 'bg-[#FCE7D6] text-[#6B4E3D]' :
                      idx % 3 === 1 ? 'bg-amber-100 text-amber-700' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {order.buyer?.initials || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1A1A1A] truncate">{order.deliveryAddress?.companyName || order.buyer?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-[#A89F91] font-medium truncate">{order.deliveryAddress ? `${order.deliveryAddress.city}, ${order.deliveryAddress.state}` : (order.buyer?.location || '—')}</p>
                    </div>
                  </div>

                  {/* Items & Value */}
                  <div>
                    <p className="text-sm font-bold text-[#1A1A1A]">{order.items}</p>
                    <p className="text-[10px] text-[#A89F91] font-medium">{order.value}</p>
                  </div>

                  {/* Status */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold w-fit ${STATUS_COLORS[order.status] ?? 'bg-stone-100 text-stone-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[order.status] ?? 'bg-stone-400'}`} />
                    {order.status}
                  </span>

                  {/* Due Date */}
                  <p className={`text-sm font-medium text-[#1A1A1A] ${order.status === 'Shipped' ? 'line-through text-[#A89F91]' : ''}`}>
                    {order.expectedDate}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    {order.status === 'New' && (
                      <>
                        <button 
                          disabled={!!processingId}
                          onClick={() => handleStatusChange(order._id, 'Rejected')} 
                          className="px-3 py-1 rounded-full text-[10px] font-bold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all"
                        >
                          Reject
                        </button>
                        <button 
                          disabled={!!processingId}
                          onClick={() => { setSelectedOrder(order); setShowModModal(true) }} 
                          className="px-3 py-1 rounded-full text-[10px] font-bold border border-[#E5D5C0] text-[#6B4E3D] hover:bg-[#F5E6D3] disabled:opacity-50 transition-all"
                        >
                          Mod
                        </button>
                        <button 
                          disabled={!!processingId}
                          onClick={() => handleStatusChange(order._id, 'Confirmed')} 
                          className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#5D4037] hover:bg-[#4E342E] text-white disabled:opacity-50 transition-all flex items-center gap-1"
                        >
                          {processingId === order._id ? <Loader2 size={10} className="animate-spin" /> : null}
                          Accept
                        </button>
                      </>
                    )}
                    {order.status === 'Confirmed' && (
                      <button 
                        disabled={!!processingId}
                        onClick={() => handleStatusChange(order._id, 'Packed')} 
                        className="px-3 py-1 rounded-full text-[10px] font-bold border border-[#E5D5C0] text-[#6B4E3D] hover:bg-[#F5E6D3] disabled:opacity-50 transition-all flex items-center gap-1"
                      >
                        {processingId === order._id ? <Loader2 size={10} className="animate-spin" /> : null}
                        Mark Packed
                      </button>
                    )}
                    {(order.status === 'Packed' || order.status === 'In Production') && (
                      <button 
                        disabled={!!processingId}
                        onClick={() => { setSelectedOrder(order); setShowDispatchModal(true) }} 
                        className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#5D4037] hover:bg-[#4E342E] text-white disabled:opacity-50 transition-all"
                      >
                        Dispatch
                      </button>
                    )}
                    <button onClick={() => { setSelectedOrder(order); setShowDetailsModal(true) }} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#F5E6D3] text-[#A89F91] hover:text-[#5D4037] transition-all">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-[#F0EBE4]">
            <p className="text-xs text-[#A89F91] font-medium">
              Showing {paginated.length} of {filtered.length} orders
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5E6D3] text-[#A89F91] disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    page === p ? 'bg-[#5D4037] text-white' : 'text-[#A89F91] hover:bg-[#F5E6D3] hover:text-[#5D4037]'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5E6D3] text-[#A89F91] disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom Insight Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4">
          {[
            { title: 'Inventory Alert', desc: `${stats?.totalProducts ?? 0} active products. Consider restocking before the next production batch starts.`, link: '/manufacturer/store', cta: 'Manage Inventory' },
            { title: 'Shipping Optimization', desc: `Bundle pending orders to save on logistics. Fast processing increases your rating.`, link: '/manufacturer/shipment', cta: 'View Logistics' },
            { title: 'New Inquiry', desc: `${stats?.activeDeals ?? 0} active negotiation threads. Quick responses help close deals effectively.`, link: '/manufacturer/negotiation', cta: 'Open Negotiation' },
          ].map((card, i) => (
            <div
              key={i}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-[1.5rem] border border-[#E5E1DA] p-6 cursor-pointer hover:shadow-md hover:border-[#D5C5B5] transition-all group"
            >
              <h4 className="text-sm font-bold text-[#1A1A1A] mb-2">{card.title}</h4>
              <p className="text-sm text-[#A89F91] leading-relaxed mb-5">{card.desc}</p>
              <button className="flex items-center gap-1.5 text-sm font-bold text-[#5D4037] group-hover:gap-3 transition-all">
                {card.cta} <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>

      </div>
      
      {/* Modification Modal */}
      {showModModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#FAF7F4] rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-[#5D4037] text-white px-8 py-6">
              <h3 className="text-xl font-bold">Suggest Modification</h3>
              <p className="text-white/70 text-sm mt-1">Order {selectedOrder.orderId}</p>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A89F91]">New Quantity</label>
                <Input type="number" defaultValue={parseInt(selectedOrder.items || '0')} placeholder="e.g. 150" className="bg-white border-[#E5E1DA] rounded-2xl h-11 focus-visible:ring-[#5D4037]/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A89F91]">New Delivery Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A89F91]" size={16} />
                  <Input type="date" className="pl-11 bg-white border-[#E5E1DA] rounded-2xl h-11 focus-visible:ring-[#5D4037]/20" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A89F91]">Reason</label>
                <textarea className="w-full bg-white border border-[#E5E1DA] rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20" rows={3} placeholder="Production delay, raw material shortage..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 py-3 rounded-2xl border border-[#E5E1DA] text-[#6B4E3D] font-semibold text-sm hover:bg-[#F5E6D3] transition-all" onClick={() => setShowModModal(false)}>Cancel</button>
                <button className="flex-1 py-3 rounded-2xl bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold text-sm transition-all" onClick={() => handleStatusChange(selectedOrder._id, 'Modification Suggested')}>Send Suggestion</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#FAF7F4] rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-[#5D4037] text-white px-8 py-6">
              <h3 className="text-xl font-bold">Dispatch Order</h3>
              <p className="text-white/70 text-sm mt-1">Order {selectedOrder.orderId}</p>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A89F91]">Carrier Name</label>
                <Input placeholder="BlueDart, FedEx, etc." className="bg-white border-[#E5E1DA] rounded-2xl h-11 focus-visible:ring-[#5D4037]/20" id="carrier" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A89F91]">Tracking ID</label>
                <Input placeholder="AWB12345678" className="bg-white border-[#E5E1DA] rounded-2xl h-11 focus-visible:ring-[#5D4037]/20" id="tracking" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#A89F91]">Invoice URL</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A89F91]" size={15} />
                    <Input placeholder="https://..." className="pl-10 bg-white border-[#E5E1DA] rounded-2xl h-11 text-xs focus-visible:ring-[#5D4037]/20" id="invoiceUrl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#A89F91]">Lorry Receipt</label>
                  <div className="relative">
                    <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A89F91]" size={15} />
                    <Input placeholder="https://..." className="pl-10 bg-white border-[#E5E1DA] rounded-2xl h-11 text-xs focus-visible:ring-[#5D4037]/20" id="lrUrl" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 py-3 rounded-2xl border border-[#E5E1DA] text-[#6B4E3D] font-semibold text-sm hover:bg-[#F5E6D3] transition-all" onClick={() => setShowDispatchModal(false)}>Cancel</button>
                <button className="flex-1 py-3 rounded-2xl bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold text-sm transition-all" onClick={() => {
                  const carrier = (document.getElementById('carrier') as HTMLInputElement).value
                  const tracking = (document.getElementById('tracking') as HTMLInputElement).value
                  const invoiceUrl = (document.getElementById('invoiceUrl') as HTMLInputElement).value
                  const lrUrl = (document.getElementById('lrUrl') as HTMLInputElement).value
                  handleStatusChange(selectedOrder._id, 'Shipped', { carrier, tracking, invoiceUrl, lrUrl })
                }}>Confirm Dispatch</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-[#FAF7F4] rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#5D4037] text-white px-8 py-6 flex items-start justify-between flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold">Order {selectedOrder.orderId}</h3>
                <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white`}>
                  {selectedOrder.status}
                </span>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 text-white text-lg leading-none">×</button>
            </div>

            <div className="p-8 space-y-4 overflow-y-auto">
              <div className="bg-white rounded-2xl p-5 border border-[#E5E1DA]">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#A89F91] mb-3">Delivery Address</h4>
                {selectedOrder.deliveryAddress ? (
                  <div className="text-sm text-[#1A1A1A]">
                    <p className="font-bold">{selectedOrder.deliveryAddress.fullName} {selectedOrder.deliveryAddress.companyName && `(${selectedOrder.deliveryAddress.companyName})`}</p>
                    <p className="text-[#A89F91] mt-1">{selectedOrder.deliveryAddress.addressLine1}</p>
                    {selectedOrder.deliveryAddress.addressLine2 && <p className="text-[#A89F91]">{selectedOrder.deliveryAddress.addressLine2}</p>}
                    <p className="text-[#A89F91]">{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.pincode}</p>
                    <p className="mt-2 font-semibold text-[#5D4037]">📞 {selectedOrder.deliveryAddress.phone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[#A89F91]">No structured delivery address provided.</p>
                )}
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#E5E1DA]">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#A89F91] mb-3">Order Items</h4>
                <p className="text-sm font-bold text-[#1A1A1A]">{selectedOrder.items}</p>
                <p className="text-xs text-[#A89F91] mt-1">Total Value: {selectedOrder.value}</p>
              </div>
            </div>

            <div className="px-8 pb-8 flex-shrink-0">
              <button className="w-full py-3 rounded-2xl bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold text-sm transition-all" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

