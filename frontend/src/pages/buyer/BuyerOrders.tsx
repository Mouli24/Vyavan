import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Order } from '@/lib/api'
import {
  Package, Truck, CheckCircle, Clock, XCircle,
  Search, Filter, Eye, RotateCcw, Star,
} from 'lucide-react'
import BuyerNavbar from '@/components/layout/BuyerNavbar'

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  'In Production':    { label: 'In Production', color: 'bg-blue-100 text-blue-700', icon: RotateCcw },
  'Pending Payment':  { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700', icon: Clock },
  'Shipped':          { label: 'Shipped', color: 'bg-[#F3EEFF] text-[#5D4037]', icon: Truck },
  'Delivered':        { label: 'Delivered', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
  'Cancelled':        { label: 'Cancelled', color: 'bg-red-100 text-red-600', icon: XCircle },
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, color: 'bg-gray-100 text-gray-600', icon: Package }
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

export default function BuyerOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null)
  const [complaintOrder, setComplaintOrder] = useState<Order | null>(null)
  const [returnOrder, setReturnOrder] = useState<Order | null>(null)

  useEffect(() => {
    api.getOrders(statusFilter ? { status: statusFilter } : undefined)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [statusFilter])

  const filtered = orders.filter(o =>
    !search || o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
    o.items?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <BuyerNavbar activePage="orders" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5A8]" />
            <input
              type="text"
              placeholder="Search by order ID or items..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E1DA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20 focus:border-[#5D4037]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#A89F91]" />
            {['', 'In Production', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === s
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-white border border-[#E5E1DA] text-[#A89F91] hover:border-[#5D4037]/30'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', count: orders.length, color: 'bg-[#FCE7D6] text-[#5D4037]' },
            { label: 'In Production', count: orders.filter(o => o.status === 'In Production').length, color: 'bg-[#EBF3FF] text-[#2563EB]' },
            { label: 'Shipped', count: orders.filter(o => o.status === 'Shipped').length, color: 'bg-[#FCE7D6] text-[#5D4037]' },
            { label: 'Delivered', count: orders.filter(o => o.status === 'Delivered').length, color: 'bg-emerald-50 text-emerald-600' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl p-4 text-center border border-white/60`}>
              <p className="text-2xl font-bold tracking-tight">{s.count}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#5D4037] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E1DA] p-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-sp-border" />
            <p className="font-medium text-[#1A1A1A] mb-1">No orders found</p>
            <p className="text-sm text-[#A89F91]">
              {search || statusFilter ? 'Try adjusting your filters' : 'Start sourcing to place your first order'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((order) => (
              <div
                key={order._id}
                onClick={() => setSelected(order)}
                className="bg-white rounded-2xl border border-[#E5E1DA]-light shadow-card p-5 hover:border-[#5D4037]/20 hover:shadow-card-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 bg-[#FCE7D6] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-[#5D4037]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-[#1A1A1A]">{order.orderId}</span>
                        <StatusBadge status={order.status} />
                        {order.products?.some(p => p.isSample) && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-black uppercase">Sample</span>
                        )}
                      </div>
                      <p className="text-sm text-[#A89F91]">
                        {order.products?.some(p => p.isSample) ? 'Request for Sample Product' : order.items}
                      </p>
                      <p className="text-xs text-[#C4B5A8] mt-0.5">Expected: {order.expectedDate || 'TBD'}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[#5D4037]">{order.value}</p>
                    <div className="flex flex-col items-end gap-1.5 mt-1.5">
                      <button className="flex items-center gap-1 text-xs text-[#A89F91] hover:text-[#5D4037] transition-colors">
                        <Eye className="w-3 h-3" /> Details
                      </button>
                      {order.status === 'Delivered' && !order.isReviewed && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewOrder(order);
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                        >
                          <Star className="w-3 h-3 fill-current" /> Rate Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-white border-l border-[#E5E1DA] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Order Details</h2>
              <button onClick={() => setSelected(null)} className="text-[#A89F91]">✕</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1A1A1A]">{selected.orderId}</span>
                <StatusBadge status={selected.status} />
              </div>

              {/* Progress bar */}
              <div className="bg-[#FAF8F5] rounded-xl p-4">
                <p className="text-xs text-[#A89F91] mb-3 uppercase tracking-wider">Order Progress</p>
                <div className="flex items-center gap-2">
                  {['Pending', 'In Production', 'Shipped', 'Delivered'].map((s, idx, arr) => {
                    const statuses = ['', 'In Production', 'Shipped', 'Delivered']
                    const currentIdx = statuses.indexOf(selected.status)
                    const active = idx <= currentIdx
                    return (
                      <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={`flex flex-col items-center ${idx < arr.length - 1 ? 'flex-1' : ''}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-[#5D4037] text-white' : 'bg-[#E5E1DA] text-[#A89F91]'}`}>
                            {active ? '✓' : idx + 1}
                          </div>
                          <span className="text-[9px] text-[#A89F91] mt-1 text-center leading-tight">{s}</span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div className={`flex-1 h-0.5 mb-4 ${active ? 'bg-[#5D4037]' : 'bg-[#E5E1DA]'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Items', value: selected.products?.some(p => p.isSample) ? 'Request for Sample Product' : selected.items },
                  { label: 'Value', value: selected.value },
                  { label: 'Expected', value: selected.expectedDate || 'TBD' },
                  { label: 'Buyer', value: selected.buyer?.name },
                ].map(row => (
                  <div key={row.label} className="bg-[#FAF8F5] rounded-xl p-3">
                    <p className="text-[10px] text-[#A89F91] uppercase tracking-wider mb-1">{row.label}</p>
                    <p className="text-sm font-medium text-[#1A1A1A]">{row.value ?? '—'}</p>
                  </div>
                ))}
              </div>

              {selected.status === 'Shipped' && (
                <div className="pt-6">
                  <button 
                    onClick={async () => {
                      if (!confirm('Are you sure you have received the products in good condition? This will release the escrow payment.')) return;
                      try {
                        await api.markDelivered(selected._id);
                        setOrders(prev => prev.map(o => o._id === selected._id ? { ...o, status: 'Delivered', deliveredAt: new Date().toISOString() } : o));
                        setSelected(prev => prev ? { ...prev, status: 'Delivered', deliveredAt: new Date().toISOString() } : null);
                        alert('Order marked as Delivered. Payment released to manufacturer.');
                      } catch (e) {
                        alert('Failed to update status.');
                      }
                    }}
                    className="w-full py-4 bg-[#5D4037] text-white font-extrabold rounded-2xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Confirm Delivery
                  </button>
                  <p className="text-[10px] text-center text-[#A89F91] mt-3 px-4">
                    By clicking this, you confirm that you have inspected the goods and they meet your requirements.
                  </p>
                </div>
              )}

              {selected.status === 'Delivered' && (
                <div className="pt-6 space-y-3">
                   <div className="flex gap-3">
                      {!selected.isReviewed && (
                        <button 
                          onClick={() => setReviewOrder(selected)}
                          className="flex-1 py-3.5 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Star className="w-4 h-4 fill-current" /> Rate Now
                        </button>
                      )}
                      
                      {(() => {
                        const deliveredAt = selected.deliveredAt ? new Date(selected.deliveredAt).getTime() : 0;
                        const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
                        const canReturn = deliveredAt > 0 && (Date.now() - deliveredAt) < threeDaysInMs;
                        
                        return canReturn && selected.status !== 'Return Requested' && (
                          <button 
                            onClick={() => setReturnOrder(selected)}
                            className="flex-1 py-3.5 bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" /> Return Items
                          </button>
                        );
                      })()}
                   </div>

                   <button 
                     onClick={() => setComplaintOrder(selected)}
                     className="w-full py-3.5 bg-white border border-red-200 text-red-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                   >
                     <XCircle className="w-4 h-4" /> Raise Complaint
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} onDone={(rev) => {
        setOrders(prev => prev.map(o => o._id === reviewOrder._id ? { ...o, isReviewed: true, review: rev._id } : o));
        setReviewOrder(null);
        if (selected?._id === reviewOrder._id) setSelected(prev => prev ? { ...prev, isReviewed: true } : null);
      }} />}

      {/* Complaint Modal */}
      {complaintOrder && (
        <ComplaintModal 
          order={complaintOrder} 
          onClose={() => setComplaintOrder(null)} 
          onDone={() => {
            setComplaintOrder(null);
            alert('Complaint filed successfully. Manufacturer has been notified.');
          }} 
        />
      )}

      {/* Return Modal */}
      {returnOrder && (
        <ReturnModal 
          order={returnOrder} 
          onClose={() => setReturnOrder(null)} 
          onDone={() => {
            setOrders(prev => prev.map(o => o._id === returnOrder._id ? { ...o, status: 'Return Requested' } : o));
            if (selected?._id === returnOrder._id) setSelected(prev => prev ? { ...prev, status: 'Return Requested' } : null);
            setReturnOrder(null);
          }} 
        />
      )}
    </div>
  )
}

function ReviewModal({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: (rev: any) => void }) {
  const [ratings, setRatings] = useState({ quality: 5, delivery: 5, communication: 5 });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await api.submitReview({
        orderId: order._id,
        ratings,
        comment
      });
      alert('Thank you for your review!');
      onDone(res);
    } catch (e: any) {
      alert(e.message ?? 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#E5E1DA] flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1A1A1A]">Rate Your Experience</h3>
          <button onClick={onClose} className="text-[#A89F91] hover:text-[#1A1A1A]">✕</button>
        </div>
        <div className="p-6 space-y-6">
          <div className="text-center mb-2">
            <p className="text-xs text-[#A89F91] uppercase tracking-widest mb-1">Manufacturer</p>
            <p className="font-bold text-[#1A1A1A]">{(order.manufacturer as any)?.company || (order.manufacturer as any)?.name || 'Manufacturer'}</p>
          </div>

          <div className="space-y-4">
            {[
              { key: 'quality', label: 'Product Quality' },
              { key: 'delivery', label: 'Delivery Timeline' },
              { key: 'communication', label: 'Communication' },
            ].map(param => (
              <div key={param.key} className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1A1A1A]">{param.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRatings(prev => ({ ...prev, [param.key]: star }))}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        ratings[param.key as keyof typeof ratings] >= star
                          ? 'bg-amber-100 text-amber-500'
                          : 'bg-[#FAF8F5] text-sp-border hover:bg-gray-100'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${ratings[param.key as keyof typeof ratings] >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A89F91] uppercase tracking-wider mb-2">Review Comment (Optional)</label>
            <textarea
              className="w-full bg-[#FAF8F5] border border-[#E5E1DA] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20 focus:border-[#5D4037]"
              rows={3}
              placeholder="Share your experience (max 500 characters)..."
              maxLength={500}
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-[#5D4037] text-white font-extrabold rounded-2xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ComplaintModal({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const [category, setCategory] = useState('Product Quality');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description) return alert('Please provide details');
    try {
      setLoading(true);
      await api.fileComplaint({
        title: `Complaint for Order ${order.orderId}`,
        description,
        category,
        manufacturer: (order.manufacturer as any)._id || order.manufacturer,
        company: (order.manufacturer as any).company || 'Manufacturer',
        orderId: order.orderId,
      } as any);
      onDone();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#E5E1DA] flex items-center justify-between bg-red-50">
          <h3 className="text-lg font-bold text-red-700">Raise a Complaint</h3>
          <button onClick={onClose} className="text-[#A89F91]">✕</button>
        </div>
        <div className="p-8 space-y-5">
           <div>
              <label className="block text-[10px] font-black uppercase text-[#A89F91] mb-2 tracking-widest">Issue Category</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#E5E1DA] bg-[#FAF8F5] text-sm font-bold focus:outline-none"
              >
                 <option>Product Quality</option>
                 <option>Damaged Items</option>
                 <option>Missing Items</option>
                 <option>Wrong Items Received</option>
                 <option>Other</option>
              </select>
           </div>
           <div>
              <label className="block text-[10px] font-black uppercase text-[#A89F91] mb-2 tracking-widest">Description</label>
              <textarea 
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Explain the issue in detail..."
                className="w-full p-4 rounded-xl border border-[#E5E1DA] bg-[#FAF8F5] text-sm focus:outline-none"
              />
           </div>
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="w-full py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all disabled:opacity-50"
           >
             {loading ? 'Submitting...' : 'Submit Complaint'}
           </button>
        </div>
      </div>
    </div>
  );
}

function ReturnModal({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('Size/Fit Issue');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api.updateOrderStatus(order._id, 'Return Requested');
      // Also file a "special" complaint for tracking
      await api.fileComplaint({
        title: `Return Request for ${order.orderId}`,
        description: `Reason: ${reason}. Note: ${note}`,
        category: 'Return Request',
        manufacturer: (order.manufacturer as any)._id || order.manufacturer,
        company: (order.manufacturer as any).company || 'Manufacturer',
        orderId: order.orderId,
      } as any);
      alert('Return request submitted! Please wait for manufacturer approval.');
      onDone();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#E5E1DA] flex items-center justify-between bg-amber-50">
          <h3 className="text-lg font-bold text-amber-700">Request Return</h3>
          <button onClick={onClose} className="text-[#A89F91]">✕</button>
        </div>
        <div className="p-8 space-y-5">
           <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Returns must be initiated within 3 days of delivery. Goods must be in original condition.
              </p>
           </div>
           <div>
              <label className="block text-[10px] font-black uppercase text-[#A89F91] mb-2 tracking-widest">Reason for Return</label>
              <select 
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#E5E1DA] bg-[#FAF8F5] text-sm font-bold focus:outline-none"
              >
                 <option>Defective Product</option>
                 <option>Quality Not as Expected</option>
                 <option>Incorrect Quantity</option>
                 <option>Wrong Specification</option>
                 <option>Other</option>
              </select>
           </div>
           <div>
              <label className="block text-[10px] font-black uppercase text-[#A89F91] mb-2 tracking-widest">Additional Notes</label>
              <textarea 
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any other details..."
                className="w-full p-4 rounded-xl border border-[#E5E1DA] bg-[#FAF8F5] text-sm focus:outline-none"
              />
           </div>
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="w-full py-4 bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-600 transition-all disabled:opacity-50"
           >
             {loading ? 'Processing...' : 'Confirm Return Request'}
           </button>
        </div>
      </div>
    </div>
  );
}
