import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Order } from '@/lib/api'
import {
  Package, Truck, CheckCircle, Clock, XCircle,
  Search, Filter, Eye, RotateCcw,
} from 'lucide-react'
import BuyerNavbar from '@/components/layout/BuyerNavbar'

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  'In Production':    { label: 'In Production', color: 'bg-blue-100 text-blue-700', icon: RotateCcw },
  'Pending Payment':  { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700', icon: Clock },
  'Shipped':          { label: 'Shipped', color: 'bg-purple-100 text-purple-700', icon: Truck },
  'Delivered':        { label: 'Delivered', color: 'bg-sp-mint text-sp-success', icon: CheckCircle },
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
    <div className="min-h-screen bg-sp-bg">
      <BuyerNavbar activePage="orders" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-placeholder" />
            <input
              type="text"
              placeholder="Search by order ID or items..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-sp-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sp-purple/20 focus:border-sp-purple"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sp-muted" />
            {['', 'In Production', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === s
                    ? 'bg-sp-purple text-white'
                    : 'bg-white border border-sp-border text-sp-muted hover:border-sp-purple/30'
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
            { label: 'Total', count: orders.length, color: 'bg-sp-purple-pale text-sp-purple' },
            { label: 'In Production', count: orders.filter(o => o.status === 'In Production').length, color: 'bg-blue-50 text-blue-600' },
            { label: 'Shipped', count: orders.filter(o => o.status === 'Shipped').length, color: 'bg-purple-50 text-purple-600' },
            { label: 'Delivered', count: orders.filter(o => o.status === 'Delivered').length, color: 'bg-sp-mint text-sp-success' },
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
            <div className="w-8 h-8 border-2 border-sp-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sp-border p-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-sp-border" />
            <p className="font-medium text-sp-text mb-1">No orders found</p>
            <p className="text-sm text-sp-muted">
              {search || statusFilter ? 'Try adjusting your filters' : 'Start sourcing to place your first order'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((order) => (
              <div
                key={order._id}
                onClick={() => setSelected(order)}
                className="bg-white rounded-2xl border border-sp-border-light shadow-card p-5 hover:border-sp-purple/20 hover:shadow-card-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 bg-sp-purple-pale rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-sp-purple" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-sp-text">{order.orderId}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-sp-muted">{order.items}</p>
                      <p className="text-xs text-sp-placeholder mt-0.5">Expected: {order.expectedDate}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sp-purple">{order.value}</p>
                    <button className="mt-1.5 flex items-center gap-1 text-xs text-sp-muted hover:text-sp-purple transition-colors ml-auto">
                      <Eye className="w-3 h-3" /> Details
                    </button>
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
          <div className="w-full max-w-md bg-white border-l border-sp-border overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-sp-text">Order Details</h2>
              <button onClick={() => setSelected(null)} className="text-sp-muted">✕</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sp-text">{selected.orderId}</span>
                <StatusBadge status={selected.status} />
              </div>

              {/* Progress bar */}
              <div className="bg-sp-bg rounded-xl p-4">
                <p className="text-xs text-sp-muted mb-3 uppercase tracking-wider">Order Progress</p>
                <div className="flex items-center gap-2">
                  {['Pending', 'In Production', 'Shipped', 'Delivered'].map((s, idx, arr) => {
                    const statuses = ['', 'In Production', 'Shipped', 'Delivered']
                    const currentIdx = statuses.indexOf(selected.status)
                    const active = idx <= currentIdx
                    return (
                      <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={`flex flex-col items-center ${idx < arr.length - 1 ? 'flex-1' : ''}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'gradient-card-purple text-white' : 'bg-sp-border text-sp-muted'}`}>
                            {active ? '✓' : idx + 1}
                          </div>
                          <span className="text-[9px] text-sp-muted mt-1 text-center leading-tight">{s}</span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div className={`flex-1 h-0.5 mb-4 ${active ? 'bg-sp-purple' : 'bg-sp-border'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Items', value: selected.items },
                  { label: 'Value', value: selected.value },
                  { label: 'Expected', value: selected.expectedDate },
                  { label: 'Buyer', value: selected.buyer?.name },
                ].map(row => (
                  <div key={row.label} className="bg-sp-bg rounded-xl p-3">
                    <p className="text-[10px] text-sp-muted uppercase tracking-wider mb-1">{row.label}</p>
                    <p className="text-sm font-medium text-sp-text">{row.value ?? '—'}</p>
                  </div>
                ))}
              </div>

              {selected.status === 'Shipped' && (
                <div className="pt-6">
                  <button 
                    onClick={async () => {
                      if (!confirm('Are you sure you have received the products in good condition? This will release the escrow payment.')) return;
                      try {
                        // Mock API call
                        await new Promise(r => setTimeout(r, 1000));
                        setOrders(prev => prev.map(o => o._id === selected._id ? { ...o, status: 'Delivered' } : o));
                        setSelected(prev => prev ? { ...prev, status: 'Delivered' } : null);
                        alert('Order marked as Delivered. Payment released to manufacturer.');
                      } catch (e) {
                        alert('Failed to update status.');
                      }
                    }}
                    className="w-full py-4 gradient-card-purple text-white font-extrabold rounded-2xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Confirm Delivery
                  </button>
                  <p className="text-[10px] text-center text-sp-muted mt-3 px-4">
                    By clicking this, you confirm that you have inspected the goods and they meet your requirements.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
